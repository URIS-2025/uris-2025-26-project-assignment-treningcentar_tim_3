using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ReservationService.Data;
using ReservationService.Models;
using ReservationService.Models.DTO;
using ReservationService.Models.Enums;

namespace ReservationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController : ControllerBase
    {
        private readonly IReservationRepository _repo;
        private readonly IMapper _mapper;

        public ReservationController(IReservationRepository repo, IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
        }

        [HttpGet]
        public ActionResult<IEnumerable<ReservationDto>> GetAll()
        {
            var reservations = _repo.GetAllReservations();
            return Ok(_mapper.Map<IEnumerable<ReservationDto>>(reservations));
        }

        [HttpGet("{id}")]
        public ActionResult<ReservationDto> GetById(Guid id)
        {
            var reservation = _repo.GetReservationById(id);
            if (reservation == null) return NotFound();
            return Ok(_mapper.Map<ReservationDto>(reservation));
        }

        [HttpPost]
        public ActionResult<ReservationDto> Create([FromBody] ReservationCreateDto dto)
        {
            var reservation = _mapper.Map<Reservation>(dto);
            reservation.reservationId = Guid.NewGuid();
            reservation.status = ReservationStatus.Booked;

            _repo.CreateReservation(reservation);
            _repo.SaveChanges();

            var resultDto = _mapper.Map<ReservationDto>(reservation);
            return CreatedAtAction(nameof(GetById), new { id = resultDto.ReservationId }, resultDto);
        }

        [HttpPut("{id}")]
        public ActionResult Update(Guid id, [FromBody] ReservationDto dto)
        {
            var reservation = _repo.GetReservationById(id);
            if (reservation == null) return NotFound();

            _mapper.Map(dto, reservation);
            _repo.UpdateReservation(reservation);
            _repo.SaveChanges();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(Guid id)
        {
            var reservation = _repo.GetReservationById(id);
            if (reservation == null) return NotFound();

            _repo.DeleteReservation(reservation);
            _repo.SaveChanges();

            return NoContent();
        }
    }
}
