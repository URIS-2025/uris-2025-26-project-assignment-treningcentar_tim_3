using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using PaymentService.Context;
using PaymentService.Controllers;
using PaymentService.Data;
using PaymentService.Models;
using PaymentService.Models.DTO.Payment;
using PaymentService.Models.DTO.Service;
using PaymentService.Models.Enums;
using PaymentService.Profiles;
using PaymentService.ServiceCalls.Logger;
using PaymentService.ServiceCalls.Logger.DTO;
using PaymentService.ServiceCalls.ServiceService;
using PaymentService.ServiceCalls.Stripe;

namespace PaymentService.Tests.Integration
{
    [TestFixture]
    public class PaymentIntegrationTests
    {
        private PaymentContext _context = null!;
        private IMapper _mapper = null!;
        private Mock<IStripePaymentService> _stripeMock = null!;
        private Mock<IServiceService> _serviceServiceMock = null!;
        private Mock<ILoggerService> _loggerMock = null!;
        private PaymentRepository _repository = null!;
        private PaymentController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PaymentContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new TestPaymentContext(options);

            var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<PaymentProfile>());
            _mapper = mapperConfig.CreateMapper();

            _stripeMock = new Mock<IStripePaymentService>();
            _serviceServiceMock = new Mock<IServiceService>();
            _loggerMock = new Mock<ILoggerService>();
            _loggerMock.Setup(l => l.TryLogAsync(It.IsAny<LogCreationDTO>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _repository = new PaymentRepository(_context, _mapper, _stripeMock.Object, _serviceServiceMock.Object);
            _controller = new PaymentController(_repository, _mapper, _loggerMock.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
        }

        [TearDown]
        public void TearDown()
        {
            _controller?.Dispose();
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        #region Kreiranje i dohvatanje placanja — full flow

        [Test]
        public void CreatePayment_ThenGetById_ReturnsCreatedPayment()
        {
            // Arrange
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Yoga", Price = 30 });

            var createDto = new PaymentCreationDTO
            {
                Amount = 30,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash,
                ServiceId = serviceId
            };

            // Act — kreiraj
            var createResult = _controller.AddPayment(createDto);
            Assert.That(createResult.Result, Is.InstanceOf<CreatedResult>());
            var created = ((CreatedResult)createResult.Result!).Value as PaymentConfirmationDTO;
            Assert.That(created, Is.Not.Null);

            // Act — dohvati po ID-u
            var getResult = _controller.GetPaymentById(created!.PaymentId);
            Assert.That(getResult.Result, Is.InstanceOf<OkObjectResult>());
            var fetched = ((OkObjectResult)getResult.Result!).Value as PaymentDTO;

            // Assert
            Assert.That(fetched, Is.Not.Null);
            Assert.That(fetched!.Id, Is.EqualTo(created.PaymentId));
            Assert.That(fetched.Amount, Is.EqualTo(30));
            Assert.That(fetched.Status, Is.EqualTo(PaymentStatus.Pending));
            Assert.That(fetched.ServiceId, Is.EqualTo(serviceId));
        }

        [Test]
        public void CreatePayment_ThenGetAll_ContainsCreatedPayment()
        {
            // Arrange
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Pilates", Price = 40 });

            var createDto = new PaymentCreationDTO
            {
                Amount = 40,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.BankTransfer,
                ServiceId = serviceId
            };

            // Act
            _controller.AddPayment(createDto);
            var listResult = _controller.GetPayments();

            // Assert
            Assert.That(listResult.Result, Is.InstanceOf<OkObjectResult>());
            var payments = ((OkObjectResult)listResult.Result!).Value as IEnumerable<PaymentDTO>;
            Assert.That(payments!.Count(), Is.EqualTo(1));
            Assert.That(payments.First().Amount, Is.EqualTo(40));
        }

        #endregion

        #region Kreiranje kartičnog plaćanja sa Stripe-om

        [Test]
        public void CreateCardPayment_CallsStripe_AndSetsCompleted()
        {
            // Arrange
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Personal Training", Price = 100 });
            _stripeMock.Setup(s => s.CreatePaymentIntentAsync(100, "usd"))
                .ReturnsAsync(("pi_integration_test", "client_secret_test"));

            var createDto = new PaymentCreationDTO
            {
                Amount = 100,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Card,
                ServiceId = serviceId
            };

            // Act
            var result = _controller.AddPayment(createDto);
            Assert.That(result.Result, Is.InstanceOf<CreatedResult>());
            var created = ((CreatedResult)result.Result!).Value as PaymentConfirmationDTO;

            // Assert — status je Pending jer je kartica
            Assert.That(created!.Status, Is.EqualTo(PaymentStatus.Pending));
            Assert.That(created.Method, Is.EqualTo(PaymentMethod.Card));
            _stripeMock.Verify(s => s.CreatePaymentIntentAsync(100, "usd"), Times.Once);

            // Verifikuj u bazi
            var dbPayment = _context.Payments.First();
            Assert.That(dbPayment.StripePaymentIntentId, Is.EqualTo("pi_integration_test"));
        }

        #endregion

        #region Ažuriranje statusa — ceo flow

        [Test]
        public void CreatePayment_ThenUpdateStatus_PendingToCompleted()
        {
            // Arrange -Kreiranje cash payment (Pending)
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Gym", Price = 50 });

            var created = CreateCashPayment(50, serviceId);

            // Act — update na Completed
            var updateDto = new PaymentStatusUpdateDTO
            {
                Id = created.PaymentId,
                Status = PaymentStatus.Completed
            };
            var updateResult = _controller.UpdatePaymentStatus(created.PaymentId, updateDto);

            // Assert
            Assert.That(updateResult.Result, Is.InstanceOf<OkObjectResult>());
            var updated = ((OkObjectResult)updateResult.Result!).Value as PaymentConfirmationDTO;
            Assert.That(updated!.Status, Is.EqualTo(PaymentStatus.Completed));

            // Verifikuj u bazi
            var dbPayment = _context.Payments.First(p => p.Id == created.PaymentId);
            Assert.That(dbPayment.Status, Is.EqualTo(PaymentStatus.Completed));
        }

        [Test]
        public void CreatePayment_ThenInvalidStatusTransition_ReturnsBadRequest()
        {
            // Arrange — kreiraj Pending payment
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Gym", Price = 50 });

            var created = CreateCashPayment(50, serviceId);

            // Act — pokusaj Pending → Refunded (nedozvoljeno)
            var updateDto = new PaymentStatusUpdateDTO
            {
                Id = created.PaymentId,
                Status = PaymentStatus.Refunded
            };
            var updateResult = _controller.UpdatePaymentStatus(created.PaymentId, updateDto);

            // Assert
            Assert.That(updateResult.Result, Is.InstanceOf<BadRequestResult>());

            // Status ostaje Pending u bazi
            var dbPayment = _context.Payments.First(p => p.Id == created.PaymentId);
            Assert.That(dbPayment.Status, Is.EqualTo(PaymentStatus.Pending));
        }

        #endregion

        #region Refund — ceo flow

        [Test]
        public void CreatePayment_CompleteIt_ThenRefund_Success()
        {
            // Arrange
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Swimming", Price = 60 });

            var created = CreateCashPayment(60, serviceId);

            // Kompletiranje
            _repository.UpdatePaymentStatus(new PaymentStatusUpdateDTO
            {
                Id = created.PaymentId,
                Status = PaymentStatus.Completed
            });

            // Act — refund
            var refundResult = _controller.RefundPayment(created.PaymentId);

            // Assert
            Assert.That(refundResult.Result, Is.InstanceOf<OkObjectResult>());
            var refunded = ((OkObjectResult)refundResult.Result!).Value as PaymentConfirmationDTO;
            Assert.That(refunded!.Status, Is.EqualTo(PaymentStatus.Refunded));

            // Verifikuj u bazi
            var dbPayment = _context.Payments.First(p => p.Id == created.PaymentId);
            Assert.That(dbPayment.Status, Is.EqualTo(PaymentStatus.Refunded));
        }

        [Test]
        public void RefundPendingPayment_ReturnsBadRequest()
        {
            // Arrange — Pending payment
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Gym", Price = 50 });

            var created = CreateCashPayment(50, serviceId);

            // Act — pokusaj refund na Pending
            var refundResult = _controller.RefundPayment(created.PaymentId);

            // Assert
            Assert.That(refundResult.Result, Is.InstanceOf<BadRequestResult>());
        }

        [Test]
        public void RefundCardPayment_CallsStripeRefund()
        {
            // Arrange — placanje sa karticom, vec Completed
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Boxing", Price = 80 });
            _stripeMock.Setup(s => s.CreatePaymentIntentAsync(80, "usd"))
                .ReturnsAsync(("pi_card_refund_test", "client_secret_test"));
            _stripeMock.Setup(s => s.RefundPaymentAsync("pi_card_refund_test"))
                .ReturnsAsync("re_test_456");

            var createDto = new PaymentCreationDTO
            {
                Amount = 80,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Card,
                ServiceId = serviceId
            };
            var createResult = _controller.AddPayment(createDto);
            var created = ((CreatedResult)createResult.Result!).Value as PaymentConfirmationDTO;

            _repository.UpdatePaymentStatus(new PaymentStatusUpdateDTO
            {
                Id = created!.PaymentId,
                Status = PaymentStatus.Completed
            });

            // Act — refund
            var refundResult = _controller.RefundPayment(created!.PaymentId);

            // Assert
            Assert.That(refundResult.Result, Is.InstanceOf<OkObjectResult>());
            _stripeMock.Verify(s => s.RefundPaymentAsync("pi_card_refund_test"), Times.Once);
        }

        #endregion

        #region Brisanje — ceo flow

        [Test]
        public void CreatePayment_ThenDelete_ThenGetById_ReturnsNotFound()
        {
            // Arrange
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Yoga", Price = 25 });

            var created = CreateCashPayment(25, serviceId);

            // Act — obrisi
            var deleteResult = _controller.DeletePayment(created.PaymentId);
            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());

            // Act — pokusaj dohvatiti obrisanog putem id-ja
            var getResult = _controller.GetPaymentById(created.PaymentId);

            // Assert
            Assert.That(getResult.Result, Is.InstanceOf<NotFoundResult>());
            Assert.That(_context.Payments.Count(), Is.EqualTo(0));
        }

        [Test]
        public void DeleteNonexistentPayment_ReturnsNotFound()
        {
            var result = _controller.DeletePayment(Guid.NewGuid());

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        #endregion

        #region Višestruka plaćanja

        [Test]
        public void CreateMultiplePayments_GetAll_ReturnsCorrectCount()
        {
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Multi", Price = 10 });

            CreateCashPayment(10, serviceId);
            CreateCashPayment(20, serviceId);
            CreateCashPayment(30, serviceId);

            var result = _controller.GetPayments();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var payments = ((OkObjectResult)result.Result!).Value as IEnumerable<PaymentDTO>;
            Assert.That(payments!.Count(), Is.EqualTo(3));
        }

        [Test]
        public void CreatePayment_WithInvalidService_ReturnsBadRequest()
        {
            // ServiceService vraca null — servis ne postoji
            _serviceServiceMock.Setup(s => s.GetServiceById(It.IsAny<Guid>()))
                .Returns((ServiceDTO?)null);

            var dto = new PaymentCreationDTO
            {
                Amount = 50,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash,
                ServiceId = Guid.NewGuid()
            };

            var result = _controller.AddPayment(dto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        #endregion

        #region Kompletan životni ciklus plaćanja

        [Test]
        public void FullPaymentLifecycle_Create_Complete_Refund()
        {
            // Arrange
            var serviceId = Guid.NewGuid();
            _serviceServiceMock.Setup(s => s.GetServiceById(serviceId))
                .Returns(new ServiceDTO { Id = serviceId, Name = "Full Lifecycle", Price = 100 });

            // Pending
            var created = CreateCashPayment(100, serviceId);
            Assert.That(created.Status, Is.EqualTo(PaymentStatus.Pending));

            // Completed
            var updateResult = _controller.UpdatePaymentStatus(created.PaymentId,
                new PaymentStatusUpdateDTO { Id = created.PaymentId, Status = PaymentStatus.Completed });
            var updated = ((OkObjectResult)updateResult.Result!).Value as PaymentConfirmationDTO;
            Assert.That(updated!.Status, Is.EqualTo(PaymentStatus.Completed));

            // Refunded
            var refundResult = _controller.RefundPayment(created.PaymentId);
            var refunded = ((OkObjectResult)refundResult.Result!).Value as PaymentConfirmationDTO;
            Assert.That(refunded!.Status, Is.EqualTo(PaymentStatus.Refunded));

            // Verifikovanje krajnjeg stanja u bazi
            var dbPayment = _context.Payments.First(p => p.Id == created.PaymentId);
            Assert.That(dbPayment.Status, Is.EqualTo(PaymentStatus.Refunded));
        }

        #endregion

        #region Helpers

        private PaymentConfirmationDTO CreateCashPayment(decimal amount, Guid serviceId)
        {
            var dto = new PaymentCreationDTO
            {
                Amount = amount,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash,
                ServiceId = serviceId
            };
            var result = _controller.AddPayment(dto);
            return ((CreatedResult)result.Result!).Value as PaymentConfirmationDTO ?? throw new Exception("Payment creation failed");
        }

        #endregion
    }
}
