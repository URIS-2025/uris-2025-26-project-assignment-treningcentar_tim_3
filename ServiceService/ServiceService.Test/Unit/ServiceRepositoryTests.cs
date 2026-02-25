using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ServiceService.Context;
using ServiceService.Data;
using ServiceService.Models.DTO;
using ServiceService.Models.Enums;
using ServiceService.Models;
using ServiceService.Tests.Context;
using Microsoft.Data.Sqlite;

namespace ServiceService.Tests.Unit
{
    [TestFixture]
    public class ServiceRepositoryTests
    {
        private SqliteConnection _conn = null!;
        private DbContextOptions<ServiceContext> _dbOptions = null!;
        private IConfiguration _cfg = null!;

        [SetUp]
        public void SetUp()
        {
            _conn = new SqliteConnection("DataSource=:memory:");
            _conn.Open();

            _dbOptions = new DbContextOptionsBuilder<ServiceContext>()
                .UseSqlite(_conn)
                .Options;

            _cfg = new ConfigurationBuilder().AddInMemoryCollection().Build();

            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            ctx.Database.EnsureCreated();
        }

        [TearDown]
        public void TearDown()
        {
            _conn.Close();
            _conn.Dispose();
        }

        [Test]
        public void AddService_Persists_And_TrimsName()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var created = repo.AddService(new ServiceCreationDTO
            {
                Name = "  PT 1  ",
                Description = "desc",
                Price = 100,
                Category = ServiceCategory.PersonalTraining
            });

            Assert.That(created.Id, Is.Not.EqualTo(Guid.Empty));
            Assert.That(created.Name, Is.EqualTo("PT 1"));

            var fromDb = ctx.Services.AsNoTracking().FirstOrDefault(x => x.Id == created.Id);
            Assert.That(fromDb, Is.Not.Null);
            Assert.That(fromDb!.Name, Is.EqualTo("PT 1"));
        }

        [Test]
        public void GetServiceById_ReturnsNull_WhenMissing()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var result = repo.GetServiceById(Guid.NewGuid());
            Assert.That(result, Is.Null);
        }

        [Test]
        public void UpdateService_UpdatesFields()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var entity = new Service
            {
                Id = Guid.NewGuid(),
                Name = "Old",
                Description = "Old",
                Price = 10,
                Category = ServiceCategory.Membership
            };
            ctx.Services.Add(entity);
            ctx.SaveChanges();

            repo.UpdateService(entity.Id, new ServiceUpdateDTO
            {
                Name = " New ",
                Description = "NewDesc",
                Price = 99,
                Category = ServiceCategory.Nutrition
            });

            var updated = ctx.Services.AsNoTracking().First(x => x.Id == entity.Id);
            Assert.That(updated.Name, Is.EqualTo("New"));
            Assert.That(updated.Description, Is.EqualTo("NewDesc"));
            Assert.That(updated.Price, Is.EqualTo(99));
            Assert.That(updated.Category, Is.EqualTo(ServiceCategory.Nutrition));
        }

        [Test]
        public void DeleteService_RemovesEntity()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var entity = new Service
            {
                Id = Guid.NewGuid(),
                Name = "X",
                Price = 5,
                Category = ServiceCategory.Measurement
            };
            ctx.Services.Add(entity);
            ctx.SaveChanges();

            repo.DeleteService(entity.Id);

            Assert.That(ctx.Services.Any(x => x.Id == entity.Id), Is.False);
        }

        [Test]
        public void CalculateCost_ReturnsPriceTimesQuantity_OrZero()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var id = Guid.NewGuid();
            ctx.Services.Add(new Service
            {
                Id = id,
                Name = "S",
                Price = 12.5m,
                Category = ServiceCategory.GroupTraining
            });
            ctx.SaveChanges();

            Assert.That(repo.CalculateCost(id, 3), Is.EqualTo(37.5m));
            Assert.That(repo.CalculateCost(Guid.NewGuid(), 3), Is.EqualTo(0m));
        }

        [Test]
        public void GetServices_ReturnsDtos_AndMapsNullDescriptionToEmptyString()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            ctx.Services.AddRange(
                new Service
                {
                    Id = Guid.NewGuid(),
                    Name = "A",
                    Description = null,
                    Price = 10,
                    Category = ServiceCategory.Membership
                },
                new Service
                {
                    Id = Guid.NewGuid(),
                    Name = "B",
                    Description = "desc",
                    Price = 20,
                    Category = ServiceCategory.Nutrition
                });
            ctx.SaveChanges();

            var result = repo.GetServices().ToList();

            Assert.That(result.Count, Is.EqualTo(2));
            var a = result.First(x => x.Name == "A");
            Assert.That(a.Description, Is.EqualTo(string.Empty)); 
        }

        [Test]
        public void GetServiceById_MapsNullDescriptionToEmptyString()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var id = Guid.NewGuid();
            ctx.Services.Add(new Service
            {
                Id = id,
                Name = "NoDesc",
                Description = null,
                Price = 15,
                Category = ServiceCategory.Measurement
            });
            ctx.SaveChanges();

            var result = repo.GetServiceById(id);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Description, Is.EqualTo(string.Empty));
        }

        [Test]
        public void UpdateService_WhenMissing_DoesNotThrow_AndDoesNotCreate()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var missingId = Guid.NewGuid();

            Assert.DoesNotThrow(() =>
                repo.UpdateService(missingId, new ServiceUpdateDTO
                {
                    Name = "X",
                    Description = "Y",
                    Price = 1,
                    Category = ServiceCategory.Membership
                })
            );

            Assert.That(ctx.Services.Any(x => x.Id == missingId), Is.False);
        }

        [Test]
        public void DeleteService_WhenMissing_DoesNotThrow()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            Assert.DoesNotThrow(() => repo.DeleteService(Guid.NewGuid()));
        }

        [Test]
        public void ServiceExists_ReturnsTrueWhenExists_ElseFalse()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var id = Guid.NewGuid();
            ctx.Services.Add(new Service
            {
                Id = id,
                Name = "Exists",
                Price = 10,
                Category = ServiceCategory.GroupTraining
            });
            ctx.SaveChanges();

            Assert.That(repo.ServiceExists(id), Is.True);
            Assert.That(repo.ServiceExists(Guid.NewGuid()), Is.False);
        }

        [Test]
        public void AddService_PersistsDescriptionPriceAndCategory()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var created = repo.AddService(new ServiceCreationDTO
            {
                Name = "Service X",
                Description = "Some description",
                Price = 123.45m,
                Category = ServiceCategory.Nutrition
            });

            var fromDb = ctx.Services.AsNoTracking().Single(x => x.Id == created.Id);

            Assert.That(fromDb.Description, Is.EqualTo("Some description"));
            Assert.That(fromDb.Price, Is.EqualTo(123.45m));
            Assert.That(fromDb.Category, Is.EqualTo(ServiceCategory.Nutrition));
        }

        [Test]
        public void CalculateCost_QuantityZero_ReturnsZero()
        {
            using var ctx = new TestServiceContext(_dbOptions, _cfg);
            var repo = new ServiceRepository(ctx);

            var id = Guid.NewGuid();
            ctx.Services.Add(new Service
            {
                Id = id,
                Name = "S",
                Price = 50m,
                Category = ServiceCategory.PersonalTraining
            });
            ctx.SaveChanges();

            Assert.That(repo.CalculateCost(id, 0), Is.EqualTo(0m));
        }
    }
}

