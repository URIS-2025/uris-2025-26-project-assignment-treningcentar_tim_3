using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using PaymentService.Context;
using PaymentService.Data;
using PaymentService.Models;
using PaymentService.Models.DTO.Payment;
using PaymentService.Models.DTO.Service;
using PaymentService.Models.Enums;
using PaymentService.Profiles;
using PaymentService.ServiceCalls.ServiceService;
using PaymentService.ServiceCalls.Stripe;

namespace PaymentService.Tests.Unit
{
    [TestFixture]
    public class PaymentRepositoryTests
    {
        private PaymentContext _context = null!;
        private IMapper _mapper = null!;
        private Mock<IStripePaymentService> _stripeServiceMock = null!;
        private Mock<IServiceService> _serviceServiceMock = null!;
        private PaymentRepository _repository = null!;

        [SetUp]
        public void SetUp()
        {
            // InMemory baza za svaki test 
            var options = new DbContextOptionsBuilder<PaymentContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new TestPaymentContext(options);

            var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<PaymentProfile>());
            _mapper = mapperConfig.CreateMapper();

            _stripeServiceMock = new Mock<IStripePaymentService>();
            _serviceServiceMock = new Mock<IServiceService>();

            _repository = new PaymentRepository(_context, _mapper, _stripeServiceMock.Object, _serviceServiceMock.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        #region GetPayments

        [Test]
        public void GetPayments_WhenNoPayments_ReturnsEmptyList()
        {
            var result = _repository.GetPayments();

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(0));
        }

        [Test]
        public void GetPayments_WhenPaymentsExist_ReturnsAllPayments()
        {
            _context.Payments.AddRange(
                new Payment { Id = Guid.NewGuid(), Amount = 100, PaymentDate = DateTime.UtcNow, Method = PaymentMethod.Cash, Status = PaymentStatus.Completed, ServiceId = Guid.NewGuid() },
                new Payment { Id = Guid.NewGuid(), Amount = 200, PaymentDate = DateTime.UtcNow, Method = PaymentMethod.Card, Status = PaymentStatus.Pending, ServiceId = Guid.NewGuid() }
            );
            _context.SaveChanges();

            var result = _repository.GetPayments();

            Assert.That(result.Count(), Is.EqualTo(2));
        }

        #endregion

        #region GetPaymentById

        [Test]
        public void GetPaymentById_WhenPaymentExists_ReturnsPaymentDTO()
        {
            var id = Guid.NewGuid();
            _context.Payments.Add(new Payment
            {
                Id = id,
                Amount = 150,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.BankTransfer,
                Status = PaymentStatus.Completed,
                ServiceId = Guid.NewGuid()
            });
            _context.SaveChanges();

            var result = _repository.GetPaymentById(id);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(id));
            Assert.That(result.Amount, Is.EqualTo(150));
        }

        [Test]
        public void GetPaymentById_WhenPaymentDoesNotExist_ReturnsNull()
        {
            var result = _repository.GetPaymentById(Guid.NewGuid());

            Assert.That(result, Is.Null);
        }

        #endregion

        #region AddPayment

        [Test]
        public void AddPayment_WithCashMethod_CreatesPaymentWithPendingStatus()
        {
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Gym", Price = 50 });

            var dto = new PaymentCreationDTO
            {
                Amount = 50,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash,
                ServiceId = serviceId
            };

            var result = _repository.AddPayment(dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Amount, Is.EqualTo(50));
            Assert.That(result.Status, Is.EqualTo(PaymentStatus.Pending));
            Assert.That(result.Method, Is.EqualTo(PaymentMethod.Cash));
            Assert.That(_context.Payments.Count(), Is.EqualTo(1));
        }

        [Test]
        public void AddPayment_WithCardMethod_CallsStripeAndSetsCompleted()
        {
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Personal Training", Price = 100 });

            _stripeServiceMock.Setup(s => s.CreatePaymentIntentAsync(100, "usd"))
                .ReturnsAsync(("pi_test_12345", "client_secret_test"));

            var dto = new PaymentCreationDTO
            {
                Amount = 100,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Card,
                ServiceId = serviceId
            };

            var result = _repository.AddPayment(dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Status, Is.EqualTo(PaymentStatus.Pending));
            _stripeServiceMock.Verify(s => s.CreatePaymentIntentAsync(100, "usd"), Times.Once);

            var saved = _context.Payments.First();
            Assert.That(saved.StripePaymentIntentId, Is.EqualTo("pi_test_12345"));
        }

        [Test]
        public void AddPayment_WithNonexistentService_ThrowsException()
        {
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns((ServiceDTO?)null);

            var dto = new PaymentCreationDTO
            {
                Amount = 50,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash,
                ServiceId = serviceId
            };

            var ex = Assert.Throws<Exception>(() => _repository.AddPayment(dto));
            Assert.That(ex!.Message, Does.Contain("does not exist"));
        }

        #endregion

        #region UpdatePaymentStatus

        [Test]
        public void UpdatePaymentStatus_PendingToCompleted_Succeeds()
        {
            var id = Guid.NewGuid();
            _context.Payments.Add(new Payment
            {
                Id = id, Amount = 100, PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash, Status = PaymentStatus.Pending, ServiceId = Guid.NewGuid()
            });
            _context.SaveChanges();

            var result = _repository.UpdatePaymentStatus(new PaymentStatusUpdateDTO
            {
                Id = id,
                Status = PaymentStatus.Completed
            });

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Status, Is.EqualTo(PaymentStatus.Completed));
        }

        [Test]
        public void UpdatePaymentStatus_PendingToFailed_Succeeds()
        {
            var id = Guid.NewGuid();
            _context.Payments.Add(new Payment
            {
                Id = id, Amount = 100, PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash, Status = PaymentStatus.Pending, ServiceId = Guid.NewGuid()
            });
            _context.SaveChanges();

            var result = _repository.UpdatePaymentStatus(new PaymentStatusUpdateDTO
            {
                Id = id,
                Status = PaymentStatus.Failed
            });

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Status, Is.EqualTo(PaymentStatus.Failed));
        }

        [Test]
        public void UpdatePaymentStatus_CompletedToRefunded_Succeeds()
        {
            var id = Guid.NewGuid();
            _context.Payments.Add(new Payment
            {
                Id = id, Amount = 100, PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash, Status = PaymentStatus.Completed, ServiceId = Guid.NewGuid()
            });
            _context.SaveChanges();

            var result = _repository.UpdatePaymentStatus(new PaymentStatusUpdateDTO
            {
                Id = id,
                Status = PaymentStatus.Refunded
            });

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Status, Is.EqualTo(PaymentStatus.Refunded));
        }

        [Test]
        public void UpdatePaymentStatus_InvalidTransition_ReturnsNull()
        {
            var id = Guid.NewGuid();
            _context.Payments.Add(new Payment
            {
                Id = id, Amount = 100, PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash, Status = PaymentStatus.Failed, ServiceId = Guid.NewGuid()
            });
            _context.SaveChanges();

            var result = _repository.UpdatePaymentStatus(new PaymentStatusUpdateDTO
            {
                Id = id,
                Status = PaymentStatus.Completed
            });

            Assert.That(result, Is.Null);
        }

        [Test]
        public void UpdatePaymentStatus_NonexistentPayment_ReturnsNull()
        {
            var result = _repository.UpdatePaymentStatus(new PaymentStatusUpdateDTO
            {
                Id = Guid.NewGuid(),
                Status = PaymentStatus.Completed
            });

            Assert.That(result, Is.Null);
        }

        #endregion

        #region RefundPayment

        [Test]
        public void RefundPayment_CompletedCashPayment_RefundsSuccessfully()
        {
            var id = Guid.NewGuid();
            _context.Payments.Add(new Payment
            {
                Id = id, Amount = 100, PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash, Status = PaymentStatus.Completed, ServiceId = Guid.NewGuid()
            });
            _context.SaveChanges();

            var result = _repository.RefundPayment(id);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Status, Is.EqualTo(PaymentStatus.Refunded));
        }

        [Test]
        public void RefundPayment_CompletedCardPayment_CallsStripeRefund()
        {
            var id = Guid.NewGuid();
            _context.Payments.Add(new Payment
            {
                Id = id, Amount = 100, PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Card, Status = PaymentStatus.Completed,
                ServiceId = Guid.NewGuid(), StripePaymentIntentId = "pi_test_refund"
            });
            _context.SaveChanges();

            _stripeServiceMock.Setup(s => s.RefundPaymentAsync("pi_test_refund"))
                .ReturnsAsync("re_test_123");

            var result = _repository.RefundPayment(id);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Status, Is.EqualTo(PaymentStatus.Refunded));
            _stripeServiceMock.Verify(s => s.RefundPaymentAsync("pi_test_refund"), Times.Once);
        }

        [Test]
        public void RefundPayment_PendingPayment_ReturnsNull()
        {
            var id = Guid.NewGuid();
            _context.Payments.Add(new Payment
            {
                Id = id, Amount = 100, PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash, Status = PaymentStatus.Pending, ServiceId = Guid.NewGuid()
            });
            _context.SaveChanges();

            var result = _repository.RefundPayment(id);

            Assert.That(result, Is.Null);
        }

        [Test]
        public void RefundPayment_NonexistentPayment_ReturnsNull()
        {
            var result = _repository.RefundPayment(Guid.NewGuid());

            Assert.That(result, Is.Null);
        }

        #endregion

        #region DeletePayment

        [Test]
        public void DeletePayment_ExistingPayment_RemovesFromDatabase()
        {
            var id = Guid.NewGuid();
            _context.Payments.Add(new Payment
            {
                Id = id, Amount = 100, PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash, Status = PaymentStatus.Pending, ServiceId = Guid.NewGuid()
            });
            _context.SaveChanges();

            _repository.DeletePayment(id);

            Assert.That(_context.Payments.Count(), Is.EqualTo(0));
        }

        [Test]
        public void DeletePayment_NonexistentPayment_DoesNotThrow()
        {
            Assert.DoesNotThrow(() => _repository.DeletePayment(Guid.NewGuid()));
        }

        #endregion
    }
}
