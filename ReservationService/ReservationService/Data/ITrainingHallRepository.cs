using ReservationService.Models;
using ReservationService.Models.DTO;

namespace ReservationService.Data
{
    public interface ITrainingHallRepository
    {
        bool SaveChanges();
        TrainingHallConfirmationDto AddTrainingHall(TrainingHallCreateDto trainingHall);
        TrainingHallDto GetTrainingHallById(Guid id);
        IEnumerable<TrainingHallDto> GetTrainingHalls();
        TrainingHallConfirmationDto UpdateTrainingHall(TrainingHallUpdateDto trainingHall);
        void DeleteTrainingHall(Guid id);
    }
}