using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Web;

namespace Consensus.Models
{
	public class PokerRoom
	{
		public PokerRoom()
		{
			Users = new List<PokerUser>();
			Cards = new List<PokerCard>();
            Estimate = new List<StoryEstimate>();
		}

		public string Name { get; set; }
		public string Topic { get; set; }
        public string AdminUser { get; set; }
        public string TopicId { get; set;}
        public string TopicDesc { get; set; }
        public string TopicCapability { get; set;}
        public decimal? maxCardval { get; set;}
        public decimal? minCardval { get; set; }
        public virtual ICollection<PokerUser> Users { get; set; } 
		public virtual ICollection<PokerCard> Cards { get; set; }
        public virtual ICollection<StoryEstimate> Estimate { get; set; }
    }
}