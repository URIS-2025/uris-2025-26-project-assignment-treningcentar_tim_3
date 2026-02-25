using AutoMapper;
using LoggerService.Context;
using LoggerService.Data;
using LoggerService.Models;
using LoggerService.Models.DTO;
using LoggerService.Models.Enums;
using LoggerService.Tests.Context;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;

namespace LoggerService.Tests.Unit
{
    [TestFixture]
    public class LoggerRepositoryTests
    {
        private SqliteConnection _conn = null!;
        private DbContextOptions<LoggerContext> _dbOptions = null!;
        private IConfiguration _cfg = null!;
        private Mock<IMapper> _mapperMock = null!;

        [SetUp]
        public void SetUp()
        {
            _conn = new SqliteConnection("DataSource=:memory:");
            _conn.Open();

            _dbOptions = new DbContextOptionsBuilder<LoggerContext>()
                .UseSqlite(_conn)
                .Options;

            _cfg = new ConfigurationBuilder().AddInMemoryCollection().Build();

            _mapperMock = new Mock<IMapper>();

            // LogCreationDTO -> LogEntry
            _mapperMock
                .Setup(m => m.Map<LogEntry>(It.IsAny<LogCreationDTO>()))
                .Returns((LogCreationDTO dto) => new LogEntry
                {
                    Level = dto.Level,
                    ServiceName = dto.ServiceName,
                    Action = dto.Action,
                    Message = dto.Message,
                    Details = dto.Details,
                    CorrelationId = dto.CorrelationId,
                    EntityType = dto.EntityType,
                    EntityId = dto.EntityId,
                    UserId = dto.UserId,
                   
                });

            // LogEntry -> LogDTO
            _mapperMock
                .Setup(m => m.Map<LogDTO>(It.IsAny<LogEntry>()))
                .Returns((LogEntry e) => new LogDTO
                {
                    Id = e.Id,
                    TimestampUtc = e.TimestampUtc,
                    Level = e.Level,
                    ServiceName = e.ServiceName,
                    Action = e.Action,
                    Message = e.Message,
                    Details = e.Details,
                    CorrelationId = e.CorrelationId,
                    EntityType = e.EntityType,
                    EntityId = e.EntityId,
                    UserId = e.UserId
                });

            // IEnumerable<LogEntry> -> IEnumerable<LogDTO>
            _mapperMock
                .Setup(m => m.Map<IEnumerable<LogDTO>>(It.IsAny<IEnumerable<LogEntry>>()))
                .Returns((IEnumerable<LogEntry> list) =>
                    list.Select(e => new LogDTO
                    {
                        Id = e.Id,
                        TimestampUtc = e.TimestampUtc,
                        Level = e.Level,
                        ServiceName = e.ServiceName,
                        Action = e.Action,
                        Message = e.Message,
                        Details = e.Details,
                        CorrelationId = e.CorrelationId,
                        EntityType = e.EntityType,
                        EntityId = e.EntityId,
                        UserId = e.UserId
                    }).ToList()
                );

            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            ctx.Database.EnsureCreated();
        }

        [TearDown]
        public void TearDown()
        {
            _conn.Close();
            _conn.Dispose();
        }

        [Test]
        public void Create_Persists_And_SetsUtcTimestamp()
        {
            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            var repo = new LoggerRepository(ctx, _mapperMock.Object);

            var providedTs = new DateTime(2026, 2, 25, 10, 30, 0);

            var created = repo.Create(new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "ServiceService",
                Action = "Create",
                Message = "Created",
                EntityId = Guid.NewGuid(),
                TimestampUtc = providedTs
            });

            Assert.That(created.Id, Is.Not.EqualTo(Guid.Empty));

            var fromDb = ctx.Logs.AsNoTracking().Single(x => x.Id == created.Id);

            Assert.That(fromDb.ServiceName, Is.EqualTo("ServiceService"));
            Assert.That(fromDb.Action, Is.EqualTo("Create"));
            Assert.That(fromDb.Level, Is.EqualTo(LogLevels.Info));
            Assert.That(fromDb.Message, Is.EqualTo("Created"));

            var expected = DateTime.SpecifyKind(providedTs, DateTimeKind.Utc);
            Assert.That(fromDb.TimestampUtc, Is.EqualTo(expected));
        }

        [Test]
        public void Create_WhenTimestampMissing_SetsUtcNow()
        {
            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            var repo = new LoggerRepository(ctx, _mapperMock.Object);

            var before = DateTime.UtcNow.AddSeconds(-2);

            var created = repo.Create(new LogCreationDTO
            {
                Level = LogLevels.Warning,
                ServiceName = "PaymentService",
                Action = "Pay",
                Message = "Something happened"
            });

            var fromDb = ctx.Logs.AsNoTracking().Single(x => x.Id == created.Id);

            Assert.That(fromDb.TimestampUtc, Is.GreaterThanOrEqualTo(before));

            var after = DateTime.UtcNow.AddSeconds(2);
            Assert.That(fromDb.TimestampUtc, Is.LessThanOrEqualTo(after));
        }


        [Test]
        public void GetById_ReturnsNull_WhenMissing()
        {
            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            var repo = new LoggerRepository(ctx, _mapperMock.Object);

            var result = repo.GetById(Guid.NewGuid());

            Assert.That(result, Is.Null);
        }

        [Test]
        public void GetById_ReturnsDto_WhenExists()
        {
            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            var repo = new LoggerRepository(ctx, _mapperMock.Object);

            var id = Guid.NewGuid();

            ctx.Logs.Add(new LogEntry
            {
                Id = id,
                Level = LogLevels.Error,
                ServiceName = "ReservationService",
                Action = "Update",
                Message = "Failed",
                TimestampUtc = DateTime.UtcNow
            });
            ctx.SaveChanges();

            var result = repo.GetById(id);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(id));
            Assert.That(result.ServiceName, Is.EqualTo("ReservationService"));
        }

        [Test]
        public void GetAll_ReturnsOrderedDesc_AndRespectsTake()
        {
            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            var repo = new LoggerRepository(ctx, _mapperMock.Object);

            var t1 = new DateTime(2026, 2, 25, 10, 0, 0, DateTimeKind.Utc);
            var t2 = new DateTime(2026, 2, 25, 10, 5, 0, DateTimeKind.Utc);
            var t3 = new DateTime(2026, 2, 25, 10, 10, 0, DateTimeKind.Utc);

            ctx.Logs.AddRange(
                new LogEntry { Id = Guid.NewGuid(), Level = LogLevels.Info, ServiceName = "A", Action = "X", Message = "1", TimestampUtc = t1 },
                new LogEntry { Id = Guid.NewGuid(), Level = LogLevels.Info, ServiceName = "A", Action = "X", Message = "2", TimestampUtc = t2 },
                new LogEntry { Id = Guid.NewGuid(), Level = LogLevels.Info, ServiceName = "A", Action = "X", Message = "3", TimestampUtc = t3 }
            );
            ctx.SaveChanges();

            var result = repo.GetAll(2).ToList();

            Assert.That(result.Count, Is.EqualTo(2));
            Assert.That(result[0].Message, Is.EqualTo("3")); 
            Assert.That(result[1].Message, Is.EqualTo("2"));
        }

     
        [Test]
        public void Search_FiltersCorrectly()
        {
            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            var repo = new LoggerRepository(ctx, _mapperMock.Object);

            var entityId = Guid.NewGuid();
            var inside = DateTime.UtcNow.AddHours(-1);
            var outside = DateTime.UtcNow.AddDays(-2);

            ctx.Logs.AddRange(
                new LogEntry
                {
                    Id = Guid.NewGuid(),
                    Level = LogLevels.Error,
                    ServiceName = "ServiceService",
                    Action = "Create",
                    Message = "MATCH",
                    EntityId = entityId,
                    TimestampUtc = inside
                },
                new LogEntry
                {
                    Id = Guid.NewGuid(),
                    Level = LogLevels.Info,
                    ServiceName = "ServiceService",
                    Action = "Create",
                    Message = "Wrong level",
                    EntityId = entityId,
                    TimestampUtc = inside
                },
                new LogEntry
                {
                    Id = Guid.NewGuid(),
                    Level = LogLevels.Error,
                    ServiceName = "ServiceService",
                    Action = "Create",
                    Message = "Wrong date",
                    EntityId = entityId,
                    TimestampUtc = outside
                }
            );
            ctx.SaveChanges();

            var result = repo.Search(
                LogLevels.Error,
                "ServiceService",
                "Create",
                entityId,
                DateTime.UtcNow.AddHours(-2),
                DateTime.UtcNow,
                100).ToList();

            Assert.That(result.Count, Is.EqualTo(1));
            Assert.That(result[0].Message, Is.EqualTo("MATCH"));
        }

        [Test]
        public void Search_ReturnsOrderedDesc_AndRespectsTake()
        {
            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            var repo = new LoggerRepository(ctx, _mapperMock.Object);

            var now = DateTime.UtcNow;

            ctx.Logs.AddRange(
                new LogEntry { Id = Guid.NewGuid(), Level = LogLevels.Info, ServiceName = "S", Action = "A", Message = "Old", TimestampUtc = now.AddMinutes(-10) },
                new LogEntry { Id = Guid.NewGuid(), Level = LogLevels.Info, ServiceName = "S", Action = "A", Message = "Mid", TimestampUtc = now.AddMinutes(-5) },
                new LogEntry { Id = Guid.NewGuid(), Level = LogLevels.Info, ServiceName = "S", Action = "A", Message = "New", TimestampUtc = now.AddMinutes(-1) }
            );
            ctx.SaveChanges();

            var result = repo.Search(null, null, null, null, null, null, 2).ToList();

            Assert.That(result.Count, Is.EqualTo(2));
            Assert.That(result[0].Message, Is.EqualTo("New"));
            Assert.That(result[1].Message, Is.EqualTo("Mid"));
        }


        [Test]
        public void Delete_RemovesEntity()
        {
            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            var repo = new LoggerRepository(ctx, _mapperMock.Object);

            var id = Guid.NewGuid();

            ctx.Logs.Add(new LogEntry
            {
                Id = id,
                Level = LogLevels.Info,
                ServiceName = "LoggerService",
                Action = "Delete",
                Message = "X",
                TimestampUtc = DateTime.UtcNow
            });
            ctx.SaveChanges();

            repo.Delete(id);

            Assert.That(ctx.Logs.Any(x => x.Id == id), Is.False);
        }

        [Test]
        public void Delete_WhenMissing_DoesNotThrow()
        {
            using var ctx = new TestLoggerContext(_dbOptions, _cfg);
            var repo = new LoggerRepository(ctx, _mapperMock.Object);

            Assert.DoesNotThrow(() => repo.Delete(Guid.NewGuid()));
        }
    }
}
