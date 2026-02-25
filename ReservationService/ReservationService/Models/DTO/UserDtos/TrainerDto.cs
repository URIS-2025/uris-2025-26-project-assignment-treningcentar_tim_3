namespace ReservationService.Models.DTO.MemberDtos;

public class TrainerDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; }

    public string LastName { get; set; }

    public string Username { get; set; }

    public string Email { get; set; }
}