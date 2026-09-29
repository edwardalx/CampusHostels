using CampusHostels.API.Domain.Enums;

namespace CampusHostels.API.Domain.Entities;

public class ManagerFunction
{
	public int Id { get; set; }

	public int ManagerId { get; set; }
	public Manager Manager { get; set; } = null!;

	public FunctionType Function { get; set; } = FunctionType.None;
	public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
	public bool IsActive { get; set; } = true;
}