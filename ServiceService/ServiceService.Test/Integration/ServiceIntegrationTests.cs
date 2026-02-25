using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ServiceService.Context;
using ServiceService.Controllers;
using ServiceService.Data;
using ServiceService.Models.DTO;
using ServiceService.Models.Enums;
using ServiceService.Profiles;
using ServiceService.ServiceCalls.Logger;
using ServiceService.ServiceCalls.Logger.DTO;
using ServiceService.Tests.Context;

namespace ServiceService.Tests.Integration
{
    [TestFixture]
    public class ServiceIntegrationTests
    {
        private ServiceContext _context = null!;
        private IServiceRepository _repository = null!;
        private Mock<ILoggerService> _loggerMock = null!;
        private IMapper _mapper = null!;
        private ServicesController _controller = null!;

        [SetUp]
        public void SetUp()
        {
          
            var options = new DbContextOptionsBuilder<ServiceContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

           
            var cfg = new Microsoft.Extensions.Configuration.ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>())
                .Build();

          
            _context = new TestServiceContext(options, cfg);

            _repository = new ServiceRepository(_context);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile(new ServiceProfile());
            }, NullLoggerFactory.Instance);

            _mapper = mapperConfig.CreateMapper();

            _loggerMock = new Mock<ILoggerService>();
            _loggerMock
                .Setup(l => l.TryLogAsync(It.IsAny<LogCreationDTO>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _controller = new ServicesController(_repository, _mapper, _loggerMock.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            _context.Database.EnsureCreated();
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        #region Create -> GetById (full flow)

        [Test]
        public async Task CreateService_ThenGetById_ReturnsCreatedService()
        {
            
            var dto = new ServiceCreationDTO
            {
                Name = "Yoga",
                Description = "Group class",
                Price = 30,
                Category = ServiceCategory.GroupTraining
            };

           
            var createResult = await _controller.Create(dto);
            Assert.That(createResult.Result, Is.InstanceOf<CreatedAtActionResult>());

            var created = ((CreatedAtActionResult)createResult.Result!).Value as ServiceDTO;
            Assert.That(created, Is.Not.Null);
            Assert.That(created!.Id, Is.Not.EqualTo(Guid.Empty));
            Assert.That(created.Name, Is.EqualTo("Yoga"));

           
            var getResult = _controller.GetById(created.Id);
            Assert.That(getResult.Result, Is.InstanceOf<OkObjectResult>());

            var fetched = ((OkObjectResult)getResult.Result!).Value as ServiceDTO;
            Assert.That(fetched, Is.Not.Null);
            Assert.That(fetched!.Id, Is.EqualTo(created.Id));
            Assert.That(fetched.Price, Is.EqualTo(30));
            Assert.That(fetched.Category, Is.EqualTo(ServiceCategory.GroupTraining));
        }

        #endregion

        #region Create -> GetAll

        [Test]
        public async Task CreateService_ThenGetAll_ContainsCreatedService()
        {
           
            var dto = new ServiceCreationDTO
            {
                Name = "Pilates",
                Description = null,
                Price = 40,
                Category = ServiceCategory.PersonalTraining
            };

            
            await _controller.Create(dto);
            var listResult = _controller.GetAll();

           
            Assert.That(listResult.Result, Is.InstanceOf<OkObjectResult>());
            var services = ((OkObjectResult)listResult.Result!).Value as IEnumerable<ServiceDTO>;
            Assert.That(services, Is.Not.Null);
            Assert.That(services!.Count(), Is.EqualTo(1));
            Assert.That(services.First().Name, Is.EqualTo("Pilates"));
        }

        #endregion

        #region Update (flow)

        [Test]
        public async Task CreateService_ThenUpdate_ThenGetById_ReturnsUpdatedData()
        {
            
            var created = await CreateService("Nutrition plan", 100, ServiceCategory.Nutrition);

            var updateDto = new ServiceUpdateDTO
            {
                Name = "Nutrition plan PRO",
                Description = "Updated",
                Price = 150,
                Category = ServiceCategory.Nutrition
            };

            
            var updateResult = await _controller.Update(created.Id, updateDto);
            Assert.That(updateResult, Is.InstanceOf<NoContentResult>());

            
            var getResult = _controller.GetById(created.Id);
            Assert.That(getResult.Result, Is.InstanceOf<OkObjectResult>());
            var fetched = ((OkObjectResult)getResult.Result!).Value as ServiceDTO;

            
            Assert.That(fetched, Is.Not.Null);
            Assert.That(fetched!.Name, Is.EqualTo("Nutrition plan PRO"));
            Assert.That(fetched.Description, Is.EqualTo("Updated"));
            Assert.That(fetched.Price, Is.EqualTo(150));
        }

        #endregion

        #region Delete (flow)

        [Test]
        public async Task CreateService_ThenDelete_ThenGetById_ReturnsNotFound()
        {
            
            var created = await CreateService("Measurement", 20, ServiceCategory.Measurement);

           
            var deleteResult = await _controller.Delete(created.Id);
            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());

           
            var getResult = _controller.GetById(created.Id);
            Assert.That(getResult.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task DeleteNonexistentService_ReturnsNotFound()
        {
            var result = await _controller.Delete(Guid.NewGuid());
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        #endregion

        #region GetAll empty -> NoContent

        [Test]
        public void GetAll_WhenEmpty_ReturnsNoContent()
        {
            var result = _controller.GetAll();
            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        #endregion

        #region Helpers

        private async Task<ServiceDTO> CreateService(string name, decimal price, ServiceCategory category)
        {
            var dto = new ServiceCreationDTO
            {
                Name = name,
                Description = "desc",
                Price = price,
                Category = category
            };

            var createResult = await _controller.Create(dto);
            var created = ((CreatedAtActionResult)createResult.Result!).Value as ServiceDTO;

            return created ?? throw new Exception("Service creation failed");
        }

        #endregion

        [Test]
        public void GetById_WhenMissing_ReturnsNotFound()
        {
            var result = _controller.GetById(Guid.NewGuid());
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task Create_InvalidModelState_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("Name", "Required");

            var result = await _controller.Create(new ServiceCreationDTO
            {
                Name = "", // nije ni bitno kad je ModelState invalid
                Price = 10,
                Category = ServiceCategory.Membership
            });

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Update_WhenMissing_ReturnsNotFound()
        {
            var id = Guid.NewGuid();

            var result = await _controller.Update(id, new ServiceUpdateDTO
            {
                Name = "X",
                Description = "Y",
                Price = 10,
                Category = ServiceCategory.Membership
            });

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task Update_InvalidModelState_ReturnsBadRequest()
        {
            var created = await CreateService("X", 10, ServiceCategory.Membership);

            _controller.ModelState.AddModelError("Price", "Required");

            var result = await _controller.Update(created.Id, new ServiceUpdateDTO
            {
                Name = "X2",
                Description = "Y",
                Price = 0, // nije bitno kad je ModelState invalid
                Category = ServiceCategory.Membership
            });

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
    }
}

