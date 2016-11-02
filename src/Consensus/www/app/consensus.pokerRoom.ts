/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="typings/signalr/signalr.d.ts" />

interface IPokerRoomClient {
	userChanged(user: Consensus.PokerUser);
	userRemoved(user: Consensus.PokerUser);

	resetRoom(room: Consensus.PokerRoom);
	showAllCards(show: boolean);
    roomTopicChanged(topic: string, topicId: string, topicDesc: string, topicCapb: string);
    cardChanged(card: Consensus.PokerCard, room: Consensus.PokerRoom);
    selectedEstimateValue(room: Consensus.PokerRoom);
    addNextEstimate(room: Consensus.PokerRoom);
    reEstimate(room: Consensus.PokerRoom);
}

interface IPokerRoomServer {
    join(user: Consensus.PokerUser): JQueryPromise<Consensus.PokerUser>;
    joinRoom(room: Consensus.PokerRoom): JQueryPromise<Consensus.PokerRoom>;
    leaveRoom(room: Consensus.PokerRoom, user: Consensus.PokerUser): JQueryPromise<void>;

    resetRoom(room: Consensus.PokerRoom): JQueryPromise<void>;
    showAllCards(room: Consensus.PokerRoom, show: boolean): JQueryPromise<void>;
    changeRoomTopic(room: Consensus.PokerRoom, topic: string,topicId: string, topicDesc: string, topicCapb: string): JQueryPromise<void>;
    changedCard(room: Consensus.PokerRoom, value: string): JQueryPromise<void>;
    selectedEstimateValue(card: Consensus.PokerCard, room: Consensus.PokerRoom): JQueryPromise<void>;
    reEstimate(estimate: Consensus.StoryEstimate, room: Consensus.PokerRoom): JQueryPromise<void>;
    addNextEstimate(room: Consensus.PokerRoom): JQueryPromise<void>;
}

interface HubProxy {
	client: IPokerRoomClient;
	server: IPokerRoomServer;
}

interface SignalR {
	poker: HubProxy;
}

module Consensus {
	
	var app = angular.module("consensus", ["ngCookies"]);

    export interface IPokerRoomScope extends ng.IScope {

        joinModalNew: boolean;
        joinModal: boolean;
		closeJoinModal();

        joinRoomModal: boolean;
		closeJoinRoomModal();

		removeRoomUser();
		myCardValueChanged(cardVal:string);
		roomTopicChanged();
		resetRoom();
        showAllCards(show: boolean);
        selectedEstimateValue(selectedCard: PokerCard);
        reEstimate(selected: StoryEstimate);
        addNextEstimate();
        cardChangeStyle(card: PokerCard);
        allCardsShowing: boolean;
        //clasname:string

		me: PokerUser;
		room: PokerRoom;
		myCard: PokerCard;
	}

	export class PokerRoomCtrl {
		private _poker: HubProxy;
		
		// protect the injection from minification
		static $inject = ['$scope', '$location', '$cookies'];

		constructor(private $scope: IPokerRoomScope, private $location: ng.ILocationService, private $cookies: any) {
			this._poker = $.connection.poker;
            var that = this;
            $scope.joinModalNew = true;
			$scope.$watch("room.Name", function (value: string) {
				if (!value) return;
				$location.path("/rooms/" + encodeURIComponent(value));
			});
			$scope.$watch("me.Email", function (value) {
				if (!value) return;
				$cookies.userEmail = value;
			});
			$scope.$watch("me.Name", function (value) {
				if (!value) return;
				$cookies.userName = value;
			});

			$scope.allCardsShowing = false;

            $scope.myCardValueChanged = function (cardval) {              
                //$scope.myCard.Value = cardval;
                //alert($scope.myCard.Value); 
                that.changedMyCardValue(cardval);
			};

            $scope.roomTopicChanged = function () {
                that.changeRoomTopic($scope.room.Topic, $scope.room.TopicId, $scope.room.TopicDesc,$scope.room.TopicCapability);
			};

			$scope.closeJoinModal = function () {
				$scope.joinModal = !$scope.me.Name || !$scope.me.Email;
				$scope.joinRoomModal = !$scope.joinModal && !that.room;

				if (!$scope.joinModal) {
					that.join();
				}

				if (!$scope.joinRoomModal) {
					that.joinRoom();
				}
			};

			$scope.closeJoinRoomModal = function () {
				$scope.joinRoomModal = !$scope.room.Name;

				if (!$scope.joinRoomModal) {
					that.joinRoom();
				}
			};

			$scope.removeRoomUser = function () {
				that.leaveRoom(this.user);
			};

			$scope.resetRoom = function () {
				that.resetRoom();
            };
            $scope.selectedEstimateValue = function (selectedCard: PokerCard ){
                that.selectedEstimateValue(selectedCard);
            };
            $scope.reEstimate = function (selectedEstimate: StoryEstimate) {
                that.reEstimate(selectedEstimate);
            };
            $scope.addNextEstimate = function () {
                that.addNextEstimate();
            };
            $scope.cardChangeStyle = function (card: PokerCard) {
                //that.cardChangeStyle(card);
                let clasname = '';
                if (!this.allCardsShowing && card.User.Email != this.me.Email) {
                    clasname = 'card-hidden';
                }
                if (card.Value.length > 0) {
                    clasname += ' card-selected';
                }
                //if (this.$scope.room.Cards) {

                  
                //    var Numbers: string[]= $scope.room.Cards.filter(x => x.Value);
                //}
                if (card.Value == '?' || card.Value == 'Break' || card.Value == '1/2' || card.Value == '') {
                    if (card.Value == '1/2')
                    {
                        if ($scope.room.maxCardval == Number('0.5')) {
                            clasname += ' card-max';
                        }
                        if ($scope.room.minCardval == Number('0.5')) {
                            clasname += ' card-min';
                        }
                    }

                    if (card.Value == 'Break' || card.Value == '') {
                       
                        clasname += ' card-img';
                    }
                }
                else {

                    if ($scope.room.maxCardval == Number(card.Value)) {
                        clasname += ' card-max';
                    }
                    if ($scope.room.minCardval == Number(card.Value)) {
                        clasname += ' card-min';
                    }
                }
                return clasname;
            };
			$scope.showAllCards = function (show: boolean) {
				that.showAllCards(show);
			};

			this._poker.client.userChanged = (user: PokerUser) => this.userChanged(user);
            this._poker.client.userRemoved = (user: PokerUser) => this.userRemoved(user);
            this._poker.client.cardChanged = (card: PokerCard, room: PokerRoom) => this.cardChanged(card,room);
            this._poker.client.roomTopicChanged = (topic: string, topicId: string, topicDesc: string, topicCapb: string) => {
                $scope.room.Topic = topic;
                $scope.room.TopicId = topicId;
                $scope.room.TopicDesc = topicDesc;
                $scope.room.TopicCapability = topicCapb;
				$scope.$apply();
			};
			this._poker.client.showAllCards = (show: boolean) => {
				$scope.allCardsShowing = show;
				$scope.$apply();
			};
			this._poker.client.resetRoom = (room: PokerRoom) => {
				$scope.room = room;
                $scope.myCard.Value = "";               
				$scope.$apply();
			};
            this._poker.client.selectedEstimateValue = (room: PokerRoom) => {
                $scope.room = room;
                $scope.$apply();
            };
            this._poker.client.reEstimate = (room: PokerRoom) => {
                $scope.room = room;
                $scope.allCardsShowing = false;
                $scope.$apply();
            };
            this._poker.client.addNextEstimate = (room: PokerRoom) => {
                //alert($scope.room.Topic);
                //$scope.room.Topic = "";
                //$scope.room.Cards = [];
                $scope.room = room;
                $scope.$apply();
            };
			$.connection.hub.start().done(function () {
				if (that.me) {
					that.join().done(function () {
						if (that.room) {
							that.joinRoom();
						} else {
							$scope.joinRoomModal = true;
							$scope.$apply();
						}
					});
				} else {
					$scope.joinModal = true;
					$scope.$apply();
				}
			});
		}

		get myCard(): PokerCard {
			var value = this.$scope.myCard;

			if (!value) {
				var userEmail = this.$cookies.userEmail;
				var userName = this.$cookies.userName;

				if (!userEmail)
					return null;

				value = new PokerCard();
				value.User = this.me;
				value.Value = "";
			}

			return value;
		}

		get me(): PokerUser {
			var value = this.$scope.me;

			if (!value) {
				var userEmail = this.$cookies.userEmail;
				var userName = this.$cookies.userName;

				if (!userEmail)
					return null;

				value = new PokerUser();
				value.Name = userName;
				value.Email = userEmail;
			}

			return value;
		}

		get room(): PokerRoom {
			var value = this.$scope.room;

			if (!value) {
				var roomName = this.$location.path().replace("/rooms/", "");

				if (!roomName)
					return null;

				value = new PokerRoom();
				value.Name = roomName;

				this.$scope.room = value;
			}

			return value;
		}

		//#region Client

		private userChanged(user: PokerUser) {
			if (this.$scope.room.Users) {
				var found = false;

				this.$scope.room.Users = this.$scope.room.Users.map(function (roomUser) {
					if (user.Email === roomUser.Email) {
						found = true;
						roomUser = user;
					}

					return roomUser;
				});

				if (!found)
					this.$scope.room.Users.push(user);

				this.$scope.$apply();
			}
		}

		private userRemoved(user: PokerUser) {
			var found = false;

			if (user.Email === this.$scope.me.Email) {
				this.$scope.room = null;
				this.$scope.myCard = null;
				this.$location.path("");
				this.$scope.joinRoomModal = true;
			} else {
				this.$scope.room.Users = this.$scope.room.Users.filter(function (roomUser) {
					return user.Email !== roomUser.Email;
				});
				this.$scope.room.Cards = this.$scope.room.Cards.filter(function (roomCard) {
					return user.Email !== roomCard.User.Email;
				});
			}

			this.$scope.$apply();
		}

        private cardChanged(card: PokerCard, room: PokerRoom) {
			if (this.$scope.room.Cards) {
				var found = false;

				this.$scope.room.Cards = this.$scope.room.Cards.map(function (roomCard) {
					if (card.User.Email === roomCard.User.Email) {
						found = true;
						roomCard = card;
					}

					return roomCard;
				});              
				if (!found)
                    this.$scope.room.Cards.push(card);
                this.$scope.room.maxCardval = room.maxCardval;
                this.$scope.room.minCardval = room.minCardval;
				this.$scope.$apply();
			}
        }

        //public  cardChangeStyle(): any string{
        //    var that = this;
        //    string className= '';
        //    alert('js');
        //    return className;
        //    //return this._poker.server.join(user).done(function (data) {
        //    //    that.$scope.me = data;
        //    //    that.$scope.$apply();
        //    //});
        //}
        //private cardChangeStyle(card: PokerCard) {
        //    if (this.$scope.room.Cards) {
        //        var found = false;

        //        this.$scope.room.Cards = this.$scope.room.Cards.map(function (roomCard) {
        //            if (card.User.Email === roomCard.User.Email) {
        //                found = true;
        //                roomCard = card;
        //            }

        //            return roomCard;
        //        });

        //        if (!found)
        //            this.$scope.room.Cards.push(card);

        //        this.$scope.$apply();
        //    }
        //}
        ////public cardChangeStyle() {
        ////    alert('js');
        ////    if (!(this.$scope.allCardsShowing))
            
        ////        return "card - hidden";
        ////}
		//#endregion

		//#region Server

		private join(user: PokerUser = this.me): JQueryPromise<PokerUser> {
			var that = this;
			return this._poker.server.join(user).done(function (data) {
                that.$scope.me = data;               
				that.$scope.$apply();
			});
		}

		private joinRoom(room: PokerRoom = this.room) : JQueryPromise<PokerRoom> {
			this.$location.path("/rooms/" + encodeURIComponent(room.Name));

			var that = this;
			return this._poker.server.joinRoom(room).done(function (data) {
				that.$scope.room = data;
                that.$scope.joinModalNew = false;
				var me = that.me;
				data.Cards.forEach(function (card) {
					if (card.User.Email === me.Email)
						that.$scope.myCard = card;
				});

				that.$scope.$apply();
			});
		}

		private leaveRoom(user: PokerUser = this.me): JQueryPromise<void> {
			return this._poker.server.leaveRoom(this.room, user);
		}

        private resetRoom(): JQueryPromise<void> {
			return this._poker.server.resetRoom(this.room);
		}

        private showAllCards(show: boolean = true): JQueryPromise<void> {
			return this._poker.server.showAllCards(this.room, show);
		}

        private changeRoomTopic(topic: string, topicId: string, topicDesc: string, topicCapb: string): JQueryPromise<void> {
            return this._poker.server.changeRoomTopic(this.room, topic, topicId, topicDesc, topicCapb);
		}

        private changedMyCardValue(value: string): JQueryPromise<void> {
			return this._poker.server.changedCard(this.room, value);
        }
        private selectedEstimateValue(value: PokerCard): JQueryPromise<void> {
            return this._poker.server.selectedEstimateValue(value, this.room);
        }
        private addNextEstimate(): JQueryPromise<void> {
            return this._poker.server.addNextEstimate(this.room);
        }
        private reEstimate(story: StoryEstimate): JQueryPromise<void> {
            return this._poker.server.reEstimate(story, this.room);
        }
        //private classChangestyle(card: PokerCard): string {
        //    let clasname = '';
        //    if (this.allCardsShowing && card.User.Email != me.Email) {
        //        clasname = 'card-hidden';
        //    }
        //    if (card.Value.length > 0) {
        //        clasname += ' card-selected';
        //    }
        //    return clasname;
        //}
		//#endregion
	}

	// setup controller
	app.controller("PokerRoomCtrl", PokerRoomCtrl);

	export class PokerUser {
		public Name: string;
		public Email: string;
		public Disconnected: string;
	}

	export class PokerRoom {
        public Name: string;
        public TopicId: string;
        public TopicCapability: string;
        public TopicDesc: string;
        public Topic: string;
        public AdminUser: string;
        public maxCardval: number
        public minCardval: number;
        public Users: PokerUser[];
        public Cards: PokerCard[];
        public Estimate: StoryEstimate[];
	}

	export class PokerCard {
		public User: PokerUser;
		public Value: string;
    }
    export class StoryEstimate {
        public User: string;
        public Estimate: string;
        public Story: string;
        public StoryId: string;
    }
}