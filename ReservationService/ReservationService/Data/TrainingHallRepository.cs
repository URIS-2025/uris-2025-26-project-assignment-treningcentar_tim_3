using AutoMapper;
using ReservationService.Context;
using ReservationService.Models;
using ReservationService.Models.DTO;

namespace ReservationService.Data
{
    public class TrainingHallRepository : ITrainingHallRepository
    {
        private readonly ReservationContext _context;
        private readonly IMapper _mapper;

        public TrainingHallRepository(ReservationContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public bool SaveChanges()
        {
            return _context.SaveChanges() > 0;
        }

        public TrainingHallConfirmationDto AddTrainingHall(TrainingHallCreateDto trainingHall)
        {
            var newTrainingHall = _mapper.Map<TrainingHall>(trainingHall);
            newTrainingHall.trainingHallId = Guid.NewGuid();

            _context.TrainingHalls.Add(newTrainingHall);
            _context.SaveChanges();

            return _mapper.Map<TrainingHallConfirmationDto>(newTrainingHall);
        }

        public void DeleteTrainingHall(Guid id)
        {
            var trainingHall = _context.TrainingHalls.FirstOrDefault(th => th.trainingHallId == id);
            if (trainingHall != null)
            {
                _context.Remove(trainingHall);
                _context.SaveChanges();
            }
        }

        public TrainingHallDto GetTrainingHallById(Guid id)
        {
            var trainingHall = _context.TrainingHalls.FirstOrDefault(th => th.trainingHallId == id);
            if (trainingHall == null)
            {
                return null;
            }

            return _mapper.Map<TrainingHallDto>(trainingHall);
        }

        public IEnumerable<TrainingHallDto> GetTrainingHalls()
        {
            var trainingHalls = _context.TrainingHalls.ToList();
            return _mapper.Map<IEnumerable<TrainingHallDto>>(trainingHalls);
        }

        public TrainingHallConfirmationDto UpdateTrainingHall(TrainingHallUpdateDto trainingHall)
        {
            var existingTrainingHall = _context.TrainingHalls.FirstOrDefault(th => th.trainingHallId == trainingHall.TrainingHallId);

            if (existingTrainingHall != null)
            {
                existingTrainingHall.trainingHallName = trainingHall.TrainingHallName;
                existingTrainingHall.Description = trainingHall.Description;
                existingTrainingHall.Capacity = trainingHall.Capacity;

                _context.SaveChanges();
            }

            return _mapper.Map<TrainingHallConfirmationDto>(existingTrainingHall);
        }
    }
}