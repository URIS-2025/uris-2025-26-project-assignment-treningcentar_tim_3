using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using ServiceService.Controllers;
using ServiceService.Data;
using ServiceService.Models.DTO;
using ServiceService.Models.Enums;
using ServiceService.ServiceCalls.Logger;
using ServiceService.ServiceCalls.Logger.DTO;


namespace ServiceService.Tests.Unit
{
    [TestFixture]
    public class ServiceControllerTests
    {
        private Mock<IServiceRepository> _repoMock = null!;
        private Mock<IMapper> _mapperMock = null!;
        private Mock<ILoggerService> _loggerMock = null!;
        private ServicesController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _repoMock = new Mock<IServiceRepository>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILoggerService>();

         
            _loggerMock
                .Setup(l => l.TryLogAsync(It.IsAny<LogCreationDTO>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _controller = new ServicesController(_repoMock.Object, _mapperMock.Object, _loggerMock.Object);
        }

        #region GetAll

        [Test]
        public void GetAll_WhenServicesExist_ReturnsOkWithServices()
        {
            var services = new List<ServiceDTO>
            {
                new ServiceDTO { Id = Guid.NewGuid(), Name = "Yoga", Price = 30, Category = ServiceCategory.GroupTraining },
                new ServiceDTO { Id = Guid.NewGuid(), Name = "PT", Price = 100, Category = ServiceCategory.PersonalTraining }
            };

            _repoMock.Setup(r => r.GetServices()).Returns(services);

            var result = _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var data = ok!.Value as IEnumerable<ServiceDTO>;
            Assert.That(data!.Count(), Is.EqualTo(2));
        }

        [Test]
        public void GetAll_WhenEmpty_ReturnsNoContent()
        {
            _repoMock.Setup(r => r.GetServices()).Returns(new List<ServiceDTO>());

            var result = _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public void GetAll_WhenNull_ReturnsNoContent()
        {
            _repoMock.Setup(r => r.GetServices()).Returns((IEnumerable<ServiceDTO>)null!);

            var result = _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        #endregion

        #region GetById

        [Test]
        public void GetById_WhenFound_ReturnsOk()
        {
            var id = Guid.NewGuid();
            var dto = new ServiceDTO
            {
                Id = id,
                Name = "Nutrition plan",
                Price = 50,
                Category = ServiceCategory.Nutrition
            };

            _repoMock.Setup(r => r.GetServiceById(id)).Returns(dto);

            var result = _controller.GetById(id);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var returned = ok!.Value as ServiceDTO;

            Assert.That(returned, Is.Not.Null);
            Assert.That(returned!.Id, Is.EqualTo(id));
        }

        [Test]
        public void GetById_WhenNotFound_ReturnsNotFound()
        {
            _repoMock.Setup(r => r.GetServiceById(It.IsAny<Guid>())).Returns((ServiceDTO?)null);

            var result = _controller.GetById(Guid.NewGuid());

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        #endregion

        #region Create

        [Test]
        public async Task Create_ValidDto_ReturnsCreatedAtAction()
        {
            var createdId = Guid.NewGuid();
            var dto = new ServiceCreationDTO
            {
                Name = "Pilates",
                Description = "Group class",
                Price = 40,
                Category = ServiceCategory.GroupTraining
            };

            var createdDto = new ServiceDTO
            {
                Id = createdId,
                Name = "Pilates",
                Description = "Group class",
                Price = 40,
                Category = ServiceCategory.GroupTraining
            };

            _repoMock.Setup(r => r.AddService(dto)).Returns(createdDto);

            var result = await _controller.Create(dto);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var created = result.Result as CreatedAtActionResult;
            Assert.That(created!.ActionName, Is.EqualTo(nameof(ServicesController.GetById)));
            Assert.That(created.Value, Is.InstanceOf<ServiceDTO>());
        }

        [Test]
        public async Task Create_WhenRepositoryThrows_ReturnsBadRequest()
        {
            var dto = new ServiceCreationDTO
            {
                Name = "Boxing",
                Price = 60,
                Category = ServiceCategory.GroupTraining
            };

            _repoMock.Setup(r => r.AddService(dto)).Throws(new Exception("DB error"));

            var result = await _controller.Create(dto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Create_InvalidModelState_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("Name", "Required");

            var result = await _controller.Create(new ServiceCreationDTO());

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        #endregion

        #region Update

        [Test]
        public async Task Update_WhenServiceNotFound_ReturnsNotFound()
        {
            _repoMock.Setup(r => r.GetServiceById(It.IsAny<Guid>())).Returns((ServiceDTO?)null);

            var result = await _controller.Update(Guid.NewGuid(), new ServiceUpdateDTO
            {
                Name = "Updated",
                Price = 10,
                Category = ServiceCategory.Membership
            });

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task Update_ValidUpdate_ReturnsNoContent_AndCallsRepository()
        {
            var id = Guid.NewGuid();
            _repoMock.Setup(r => r.GetServiceById(id)).Returns(new ServiceDTO { Id = id, Name = "Old", Price = 10, Category = ServiceCategory.Membership });

            var dto = new ServiceUpdateDTO
            {
                Name = "New name",
                Description = "New desc",
                Price = 25,
                Category = ServiceCategory.Membership
            };

            var result = await _controller.Update(id, dto);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _repoMock.Verify(r => r.UpdateService(id, dto), Times.Once);
        }

        [Test]
        public async Task Update_InvalidModelState_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("Price", "Required");

            var result = await _controller.Update(Guid.NewGuid(), new ServiceUpdateDTO());

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        #endregion

        #region Delete

        [Test]
        public async Task Delete_WhenNotFound_ReturnsNotFound()
        {
            _repoMock.Setup(r => r.GetServiceById(It.IsAny<Guid>())).Returns((ServiceDTO?)null);

            var result = await _controller.Delete(Guid.NewGuid());

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task Delete_Existing_ReturnsNoContent_AndCallsRepository()
        {
            var id = Guid.NewGuid();
            _repoMock.Setup(r => r.GetServiceById(id)).Returns(new ServiceDTO { Id = id, Name = "ToDelete", Price = 10, Category = ServiceCategory.Membership });

            var result = await _controller.Delete(id);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _repoMock.Verify(r => r.DeleteService(id), Times.Once);
        }

        #endregion

        #region Options

        [Test]
        public void GetOptions_ReturnsOk_AndSetsAllowHeader()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = _controller.GetOptions();

            Assert.That(result, Is.InstanceOf<OkResult>());
            Assert.That(_controller.Response.Headers["Allow"].ToString(),
            Is.EqualTo("GET, HEAD, POST, PUT, DELETE, OPTIONS"));
        }

        #endregion
    }
}

