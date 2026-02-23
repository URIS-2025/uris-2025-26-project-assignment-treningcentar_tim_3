using AutoMapper;
using LoggerService.Context;
using LoggerService.Models;
using LoggerService.Models.DTO;
using LoggerService.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace LoggerService.Data
{
    public class LoggerRepository : ILoggerRepository
    {
        private readonly LoggerContext _context;
        private readonly IMapper _mapper;

        public LoggerRepository(LoggerContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public IEnumerable<LogDTO> GetAll(int take = 100)
        {
            var logs = _context.Logs
                .AsNoTracking()
                .OrderByDescending(l => l.TimestampUtc)
                .Take(take)
                .ToList();

            return _mapper.Map<IEnumerable<LogDTO>>(logs);
        }

        public LogDTO? GetById(Guid id)
        {
            var log = _context.Logs.AsNoTracking().FirstOrDefault(l => l.Id == id);
            return log == null ? null : _mapper.Map<LogDTO>(log);
        }

        public IEnumerable<LogDTO> Search(
            LogLevels? level,
            string? serviceName,
            string? action,
            Guid? entityId,
            DateTime? fromUtc,
            DateTime? toUtc,
            int take = 100)
        {
            var q = _context.Logs.AsNoTracking().AsQueryable();

            if (level.HasValue) q = q.Where(x => x.Level == level.Value);
            if (!string.IsNullOrWhiteSpace(serviceName)) q = q.Where(x => x.ServiceName == serviceName);
            if (!string.IsNullOrWhiteSpace(action)) q = q.Where(x => x.Action == action);
            if (entityId.HasValue) q = q.Where(x => x.EntityId == entityId.Value);
            if (fromUtc.HasValue) q = q.Where(x => x.TimestampUtc >= fromUtc.Value);
            if (toUtc.HasValue) q = q.Where(x => x.TimestampUtc <= toUtc.Value);

            var logs = q
                .OrderByDescending(x => x.TimestampUtc)
                .Take(take)
                .ToList();

            return _mapper.Map<IEnumerable<LogDTO>>(logs);
        }

        public LogDTO Create(LogCreationDTO dto)
        {
            var entity = _mapper.Map<LogEntry>(dto);
            entity.Id = Guid.NewGuid();

            entity.TimestampUtc = dto.TimestampUtc.HasValue
                ? DateTime.SpecifyKind(dto.TimestampUtc.Value, DateTimeKind.Utc)
                : DateTime.UtcNow;

            _context.Logs.Add(entity);
            _context.SaveChanges();

            return _mapper.Map<LogDTO>(entity);
        }

        public void Delete(Guid id)
        {
            var entity = _context.Logs.FirstOrDefault(x => x.Id == id);
            if (entity == null) return;

            _context.Logs.Remove(entity);
            _context.SaveChanges();
        }
    }
}