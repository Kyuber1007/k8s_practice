using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;

namespace Result.Pages
{
    public class IndexModel : PageModel
    {
        private string _optionA;
        private string _optionB;
        private string _optionC;
        private string _optionD;
        protected readonly IConfiguration _configuration;

        public string OptionA { get; private set; }
        public string OptionB { get; private set; }
        public string OptionC { get; private set; }
        public string OptionD { get; private set; }
        
        public IndexModel(IConfiguration configuration)
        {
            _configuration = configuration;
            _optionA = _configuration.GetValue<string>("Voting:OptionA");
            _optionB = _configuration.GetValue<string>("Voting:OptionB");
            _optionC = _configuration.GetValue<string>("Voting:OptionC");
            _optionD = _configuration.GetValue<string>("Voting:OptionD");
        }

        public void OnGet()
        {
            OptionA = _optionA;
            OptionB = _optionB;
            OptionC = _optionC;
            OptionD = _optionD;
        }
    }
}
