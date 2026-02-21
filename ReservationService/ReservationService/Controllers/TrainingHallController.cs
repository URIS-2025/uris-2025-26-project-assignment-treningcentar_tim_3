using Microsoft.AspNetCore.Mvc;
using ReservationService.Data;
using ReservationService.Models.DTO;

namespace ReservationService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrainingHallController : ControllerBase
    {
        private readonly ITrainingHallRepository _repository;

        public TrainingHallController(ITrainingHallRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public ActionResult<IEnumerable<TrainingHallDto>> GetTrainingHalls()
        {
            var trainingHalls = _repository.GetTrainingHalls();
            return Ok(trainingHalls);
        }

        [HttpGet("{id}")]
        public ActionResult<TrainingHallDto> GetTrainingHallById(Guid id)
        {
            var trainingHall = _repository.GetTrainingHallById(id);
            if (trainingHall == null)
            {
                return NotFound();
            }
            return Ok(trainingHall);
        }

        [HttpPost]
        public ActionResult<TrainingHallConfirmationDto> AddTrainingHall([FromBody] TrainingHallCreateDto trainingHall)
        {
            try
            {
                var newTrainingHall = _repository.AddTrainingHall(trainingHall);
                return Created(nameof(GetTrainingHallById), newTrainingHall);
            }
            catch
            {
                return BadRequest();
            }
        }

        [HttpPut]
        public ActionResult<TrainingHallConfirmationDto> UpdateTrainingHall([FromBody] TrainingHallUpdateDto trainingHall)
        {
            try
            {
                var updatedTrainingHall = _repository.UpdateTrainingHall(trainingHall);
                if (updatedTrainingHall == null)
                {
                    return NotFound();
                }
                return Ok(updatedTrainingHall);
            }
            catch
            {
                return BadRequest();
            }
        }

        [HttpDelete("{id}")]
        public ActionResult DeleteTrainingHall(Guid id)
        {
            _repository.DeleteTrainingHall(id);
            return NoContent();
        }
    }
}