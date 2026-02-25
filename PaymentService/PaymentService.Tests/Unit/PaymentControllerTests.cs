using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PaymentService.Controllers;
using PaymentService.Data;
using PaymentService.Models.DTO.Payment;
using PaymentService.Models.Enums;
using PaymentService.ServiceCalls.Logger;
using PaymentService.ServiceCalls.Logger.DTO;

namespace PaymentService.Tests.Unit
{
    [TestFixture]
    public class PaymentControllerTests
    {
        private Mock<IPaymentRepository> _repoMock = null!;
        private Mock<IMapper> _mapperMock = null!;
        private Mock<ILoggerService> _loggerMock = null!;
        private PaymentController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _repoMock = new Mock<IPaymentRepository>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILoggerService>();

            // Logger uvek uspesno loguje
            _loggerMock.Setup(l => l.TryLogAsync(It.IsAny<LogCreationDTO>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _controller = new PaymentController(_repoMock.Object, _mapperMock.Object, _loggerMock.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _controller?.Dispose();
        }

        #region GetPayments

        [Test]
        public void GetPayments_WhenPaymentsExist_ReturnsOkWithPayments()
        {
            var payments = new List<PaymentDTO>
            {
                new PaymentDTO { Id = Guid.NewGuid(), Amount = 100, Status = PaymentStatus.Completed },
                new PaymentDTO { Id = Guid.NewGuid(), Amount = 200, Status = PaymentStatus.Pending }
            };
            _repoMock.Setup(r => r.GetPayments()).Returns(payments);

            var result = _controller.GetPayments();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var data = ok!.Value as IEnumerable<PaymentDTO>;
            Assert.That(data!.Count(), Is.EqualTo(2));
        }

        [Test]
        public void GetPayments_WhenNoPayments_ReturnsNoContent()
        {
            _repoMock.Setup(r => r.GetPayments()).Returns(new List<PaymentDTO>());

            var result = _controller.GetPayments();

            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public void GetPayments_WhenNull_ReturnsNoContent()
        {
            _repoMock.Setup(r => r.GetPayments()).Returns((IEnumerable<PaymentDTO>)null!);

            var result = _controller.GetPayments();

            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        #endregion

        #region GetPaymentById

        [Test]
        public void GetPaymentById_WhenFound_ReturnsOk()
        {
            var id = Guid.NewGuid();
            var dto = new PaymentDTO { Id = id, Amount = 150, Status = PaymentStatus.Completed };
            _repoMock.Setup(r => r.GetPaymentById(id)).Returns(dto);

            var result = _controller.GetPaymentById(id);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var payment = ok!.Value as PaymentDTO;
            Assert.That(payment!.Id, Is.EqualTo(id));
        }

        [Test]
        public void GetPaymentById_WhenNotFound_ReturnsNotFound()
        {
            _repoMock.Setup(r => r.GetPaymentById(It.IsAny<Guid>())).Returns((PaymentDTO?)null);

            var result = _controller.GetPaymentById(Guid.NewGuid());

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        #endregion

        #region AddPayment

        [Test]
        public void AddPayment_ValidDto_ReturnsCreated()
        {
            var dto = new PaymentCreationDTO
            {
                Amount = 100,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash,
                ServiceId = Guid.NewGuid()
            };
            var confirmation = new PaymentConfirmationDTO
            {
                PaymentId = Guid.NewGuid(),
                Amount = 100,
                Status = PaymentStatus.Pending,
                Method = PaymentMethod.Cash,
                PaymentDate = DateTime.UtcNow
            };
            _repoMock.Setup(r => r.AddPayment(dto)).Returns(confirmation);

            var result = _controller.AddPayment(dto);

            Assert.That(result.Result, Is.InstanceOf<CreatedResult>());
        }

        [Test]
        public void AddPayment_WhenRepositoryThrows_ReturnsBadRequest()
        {
            var dto = new PaymentCreationDTO
            {
                Amount = 100,
                PaymentDate = DateTime.UtcNow,
                Method = PaymentMethod.Cash,
                ServiceId = Guid.NewGuid()
            };
            _repoMock.Setup(r => r.AddPayment(dto)).Throws(new Exception("Service not found"));

            var result = _controller.AddPayment(dto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void AddPayment_InvalidModelState_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("Amount", "Required");

            var result = _controller.AddPayment(new PaymentCreationDTO());

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        #endregion

        #region UpdatePaymentStatus

        [Test]
        public void UpdatePaymentStatus_ValidUpdate_ReturnsOk()
        {
            var id = Guid.NewGuid();
            var dto = new PaymentStatusUpdateDTO { Id = id, Status = PaymentStatus.Completed };
            var confirmation = new PaymentConfirmationDTO
            {
                PaymentId = id,
                Status = PaymentStatus.Completed,
                Amount = 100,
                Method = PaymentMethod.Cash
            };
            _repoMock.Setup(r => r.UpdatePaymentStatus(dto)).Returns(confirmation);

            var result = _controller.UpdatePaymentStatus(id, dto);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public void UpdatePaymentStatus_IdMismatch_ReturnsBadRequest()
        {
            var dto = new PaymentStatusUpdateDTO { Id = Guid.NewGuid(), Status = PaymentStatus.Completed };

            var result = _controller.UpdatePaymentStatus(Guid.NewGuid(), dto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void UpdatePaymentStatus_NotFoundOrInvalid_ReturnsBadRequest()
        {
            var id = Guid.NewGuid();
            var dto = new PaymentStatusUpdateDTO { Id = id, Status = PaymentStatus.Completed };
            _repoMock.Setup(r => r.UpdatePaymentStatus(dto)).Returns((PaymentConfirmationDTO?)null);

            var result = _controller.UpdatePaymentStatus(id, dto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestResult>());
        }

        [Test]
        public void UpdatePaymentStatus_InvalidModelState_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("Status", "Required");

            var result = _controller.UpdatePaymentStatus(Guid.NewGuid(), new PaymentStatusUpdateDTO());

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        #endregion

        #region RefundPayment

        [Test]
        public void RefundPayment_ExistingCompletedPayment_ReturnsOk()
        {
            var id = Guid.NewGuid();
            var paymentDto = new PaymentDTO { Id = id, Status = PaymentStatus.Completed };
            var confirmation = new PaymentConfirmationDTO
            {
                PaymentId = id,
                Status = PaymentStatus.Refunded,
                Amount = 100
            };
            _repoMock.Setup(r => r.GetPaymentById(id)).Returns(paymentDto);
            _repoMock.Setup(r => r.RefundPayment(id)).Returns(confirmation);

            var result = _controller.RefundPayment(id);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public void RefundPayment_NonexistentPayment_ReturnsNotFound()
        {
            _repoMock.Setup(r => r.GetPaymentById(It.IsAny<Guid>())).Returns((PaymentDTO?)null);

            var result = _controller.RefundPayment(Guid.NewGuid());

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public void RefundPayment_RefundReturnsNull_ReturnsBadRequest()
        {
            var id = Guid.NewGuid();
            _repoMock.Setup(r => r.GetPaymentById(id)).Returns(new PaymentDTO { Id = id });
            _repoMock.Setup(r => r.RefundPayment(id)).Returns((PaymentConfirmationDTO?)null);

            var result = _controller.RefundPayment(id);

            Assert.That(result.Result, Is.InstanceOf<BadRequestResult>());
        }

        #endregion

        #region DeletePayment

        [Test]
        public void DeletePayment_ExistingPayment_ReturnsNoContent()
        {
            var id = Guid.NewGuid();
            _repoMock.Setup(r => r.GetPaymentById(id)).Returns(new PaymentDTO { Id = id });

            var result = _controller.DeletePayment(id);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _repoMock.Verify(r => r.DeletePayment(id), Times.Once);
        }

        [Test]
        public void DeletePayment_NonexistentPayment_ReturnsNotFound()
        {
            _repoMock.Setup(r => r.GetPaymentById(It.IsAny<Guid>())).Returns((PaymentDTO?)null);

            var result = _controller.DeletePayment(Guid.NewGuid());

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        #endregion

        #region GetPaymentOptions

        [Test]
        public void GetPaymentOptions_ReturnsOkWithAllowHeader()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = _controller.GetPaymentOptions();

            Assert.That(result, Is.InstanceOf<OkResult>());
            Assert.That(_controller.Response.Headers["Allow"].ToString(), Does.Contain("GET"));
        }

        #endregion
    }
}
