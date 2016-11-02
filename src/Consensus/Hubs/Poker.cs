using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using Consensus.Models;
using Microsoft.AspNet.SignalR;
using NLog;

namespace Consensus.Hubs
{
	public class Poker : Hub
	{
		private static readonly Logger _logger = LogManager.GetCurrentClassLogger();

		private static Dictionary<string, PokerUser> _users = new Dictionary<string, PokerUser>();
		private static List<PokerRoom> _rooms = new List<PokerRoom>();

		public PokerUser Join(PokerUser user)
		{
			_logger.Info("{0} joined consensus", user.Email);

			var userRef = _users.Where(x => x.Value.Email == user.Email).Select(x => new {
				ConnectionId = x.Key,
				User = x.Value
			}).FirstOrDefault();

			if (userRef != null && userRef.ConnectionId != Context.ConnectionId)
				_users.Remove(userRef.ConnectionId);

			user = _users.Where(x => x.Key == Context.ConnectionId).Select(x => x.Value).FirstOrDefault() ?? user;

			if (!_users.ContainsKey(Context.ConnectionId))
				_users.Add(Context.ConnectionId, user);

			return user;
		}

		public PokerRoom JoinRoom(PokerRoom room)
		{
			var user = _users.Where(x => x.Key == Context.ConnectionId).Select(x => x.Value).FirstOrDefault();

			if (user == null)
				throw new Exception("No user with this connection Id has joined yet.");

			_logger.Info("{0} joined {1} room", user.Email, room.Name);

			room = _rooms.FirstOrDefault(x => x.Name == room.Name) ?? room;

            if (!_rooms.Contains(room))
            {
                room.AdminUser = user.Email;
                _rooms.Add(room);
            }

			if (room.Users.All(x => x.Email != user.Email)) {
				room.Users.Add(user);
			}

			// tell the people in this room that you've joined
			Clients.Group(room.Name).userChanged(user);

			Groups.Add(Context.ConnectionId, room.Name);

			return room;
		}

		private void AssertContextUserJoinedRoom(string roomName)
		{
			var user = _users.Where(x => x.Key == Context.ConnectionId).Select(x => x.Value).FirstOrDefault();

			if (user == null)
				throw new Exception("No user with this connection Id has joined yet.");

			var room = _rooms.FirstOrDefault(x => x.Name == roomName);

			if (room == null)
				throw new Exception("No room with this name exists.");

			if (room.Users.All(x => x.Email != user.Email)) {
				throw new Exception("User hasn't joined this room yet.");
			}
		}

		public void LeaveRoom(PokerRoom room, PokerUser user)
		{
			AssertContextUserJoinedRoom(room.Name);
			room = _rooms.FirstOrDefault(x => x.Name == room.Name);

			if (room.Users.All(x => x.Email != user.Email))
				throw new Exception("User being removed hasn't joined this room yet.");

			room.Users = room.Users.Where(x => x.Email != user.Email).ToList();
			room.Cards = room.Cards.Where(x => x.User.Email != user.Email).ToList();

			// tell the people in this room that user has been removed
			Clients.Group(room.Name).userRemoved(user);
		}

		public void ResetRoom(PokerRoom room)
		{
			AssertContextUserJoinedRoom(room.Name);

			room = _rooms.FirstOrDefault(x => x.Name == room.Name);
			room.Topic = "";
			room.Cards = new List<PokerCard>();

			// tell the people in this room that the topic has changed
			Clients.Group(room.Name).resetRoom(room);
		}

		public void ShowAllCards(PokerRoom room, bool show)
		{
			AssertContextUserJoinedRoom(room.Name);

			// tell the people in this room that the topic has changed
			Clients.Group(room.Name).showAllCards(show);
		}

		public void ChangeRoomTopic(PokerRoom room, string topic, string topicId,string topicDesc,string topicCapb)
		{
			AssertContextUserJoinedRoom(room.Name);

			room = _rooms.FirstOrDefault(x => x.Name == room.Name);            
			room.Topic = topic;
            room.TopicId = topicId;
            room.TopicDesc = topicDesc;
            room.TopicCapability = topicCapb;

            // tell the people in this room that the topic has changed
            Clients.Group(room.Name).roomTopicChanged(topic,topicId,topicDesc,topicCapb);
		}

		public void ChangedCard(PokerRoom room, string cardValue)
		{
			AssertContextUserJoinedRoom(room.Name);

			var user = _users.Where(x => x.Key == Context.ConnectionId).Select(x => x.Value).FirstOrDefault();
			room = _rooms.FirstOrDefault(x => x.Name == room.Name);

			var card = room.Cards.FirstOrDefault(x => x.User.Email == user.Email);

			if (card == null) {
				card = new PokerCard {
					User = user,
					Value = cardValue
				};
				room.Cards.Add(card);
			}
            card.Value = cardValue;
            var tempCards= room.Cards.Where(x => x.Value != "?" && x.Value != "Break" && x.Value !="").ToList();
            tempCards.Where(x => x.Value.Contains("1/2")).ToList().ForEach(a => a.Value = "0.5");
            if (tempCards != null && tempCards.Count>0)
            {
                var max = tempCards.Max(r =>Convert.ToDecimal(r.Value));
                room.maxCardval = max;
                var min = tempCards.Min(r => Convert.ToDecimal(r.Value));
                room.minCardval = min;

            }
            if (cardValue == "Break")
            {
                card.Value = "";
            }
            else
            {
                card.Value = cardValue;
            }
            //var max = room.Cards.Max(r => Int32.  (Convert.ToChar(r.Value)));
            //room.maxCardval = Convert.ToInt32(max);
            //var min = room.Cards.Min(r => Char.GetNumericValue(Convert.ToChar(r.Value)));
            //room.minCardval = Convert.ToInt32(min);


            // tell the people in this room that your card has changed
            Clients.Group(room.Name).cardChanged(card,room);
		}

		public override Task OnDisconnected(bool stopCalled)
		{
			var user = _users.Where(x => x.Key == Context.ConnectionId).Select(x => x.Value).FirstOrDefault();

			if (user != null) {
				user.Disconnected = DateTimeOffset.UtcNow;

				// tell the people in this room that you've been disconnected
				foreach(var room in _rooms.Where(x => x.Users.Contains(user)))
					Clients.Group(room.Name).userChanged(user);
			}

			return base.OnDisconnected(stopCalled);
		}
        public void SelectedEstimateValue(PokerCard card,PokerRoom room)
        {
            StoryEstimate storyDetails = new StoryEstimate();
            storyDetails.User = card.User.Name;
            storyDetails.Estimate = card.Value;
            storyDetails.Story ="As an "+room.TopicCapability+", I would like to "+ room.Topic+". So that "+room.TopicDesc;
            storyDetails.StoryId = room.TopicId;
            var story = room.Estimate.FirstOrDefault(x => x.StoryId == room.TopicId);
            if (!room.Estimate.Contains(story))
            {
                room.Estimate.Add(storyDetails);
            }
            else
            {
                room.Estimate.Remove(story);

                room.Estimate.Add(storyDetails);
            }
            
            // tell the people in this room that the topic has changed            
            Clients.Group(room.Name).selectedEstimateValue(room);            
        }
        public void AddNextEstimate(PokerRoom room)
        {
            AssertContextUserJoinedRoom(room.Name);

           // room = _rooms.FirstOrDefault(x => x.Name == room.Name);
            room.Topic = "";
            room.TopicDesc = "";
            room.TopicId = "";
            room.TopicCapability = "";
            room.Cards = new List<PokerCard>();

            // tell the people in this room that the topic has changed
            Clients.Group(room.Name).addNextEstimate(room);
        }
        public void ReEstimate(StoryEstimate estm,PokerRoom room)
        {

            AssertContextUserJoinedRoom(room.Name);

            // room = _rooms.FirstOrDefault(x => x.Name == room.Name);
            room.Topic = "";
            room.TopicDesc = "";
            room.TopicId = estm.StoryId;
            room.TopicCapability = "";
            room.Cards = new List<PokerCard>();

            // tell the people in this room that the topic has changed
            Clients.Group(room.Name).reEstimate(room);
        }

    }
}