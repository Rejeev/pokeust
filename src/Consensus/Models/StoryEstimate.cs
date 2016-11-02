using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Consensus.Models
{
    public class StoryEstimate
    {
        public string StoryId { get; set;}
        public string Story { get; set; }
        public string User { get; set;}
        public string Estimate { get; set; }

    }
}