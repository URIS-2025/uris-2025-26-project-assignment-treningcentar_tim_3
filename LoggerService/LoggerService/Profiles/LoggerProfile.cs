using AutoMapper;
using LoggerService.Models;
using LoggerService.Models.DTO;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace LoggerService.Profiles
{
    public class LoggerProfile : Profile
    {
        public LoggerProfile()
        {
            CreateMap<LogEntry, LogDTO>();
            CreateMap<LogCreationDTO, LogEntry>();
        }
    }
}