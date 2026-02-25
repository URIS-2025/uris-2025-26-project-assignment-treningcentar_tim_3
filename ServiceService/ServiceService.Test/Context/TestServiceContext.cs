using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ServiceService.Context;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ServiceService.Tests.Context
{
    public class TestServiceContext : ServiceContext
    {
        public TestServiceContext(DbContextOptions options, IConfiguration configuration)
           : base(options, configuration)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // provider dolazi iz DbContextOptions (SQLite)
        }
    }
}
