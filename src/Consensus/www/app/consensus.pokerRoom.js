/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="typings/signalr/signalr.d.ts" />
var Consensus;
(function (Consensus) {
    var app = angular.module("consensus", ["ngCookies"]);
    var PokerRoomCtrl = (function () {
        function PokerRoomCtrl($scope, $location, $cookies) {
            var _this = this;
            this.$scope = $scope;
            this.$location = $location;
            this.$cookies = $cookies;
            this._poker = $.connection.poker;
            var that = this;
            $scope.joinModalNew = true;
            $scope.$watch("room.Name", function (value) {
                if (!value)
                    return;
                $location.path("/rooms/" + encodeURIComponent(value));
            });
            $scope.$watch("me.Email", function (value) {
                if (!value)
                    return;
                $cookies.userEmail = value;
            });
            $scope.$watch("me.Name", function (value) {
                if (!value)
                    return;
                $cookies.userName = value;
            });
            $scope.allCardsShowing = false;
            $scope.myCardValueChanged = function (cardval) {
                //$scope.myCard.Value = cardval;
                //alert($scope.myCard.Value); 
                that.changedMyCardValue(cardval);
            };
            $scope.roomTopicChanged = function () {
                that.changeRoomTopic($scope.room.Topic, $scope.room.TopicId, $scope.room.TopicDesc, $scope.room.TopicCapability);
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
            $scope.selectedEstimateValue = function (selectedCard) {
                that.selectedEstimateValue(selectedCard);
            };
            $scope.reEstimate = function (selectedEstimate) {
                that.reEstimate(selectedEstimate);
            };
            $scope.addNextEstimate = function () {
                that.addNextEstimate();
            };
            $scope.cardChangeStyle = function (card) {
                //that.cardChangeStyle(card);
                var clasname = '';
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
                    if (card.Value == '1/2') {
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
            $scope.showAllCards = function (show) {
                that.showAllCards(show);
            };
            this._poker.client.userChanged = function (user) { return _this.userChanged(user); };
            this._poker.client.userRemoved = function (user) { return _this.userRemoved(user); };
            this._poker.client.cardChanged = function (card, room) { return _this.cardChanged(card, room); };
            this._poker.client.roomTopicChanged = function (topic, topicId, topicDesc, topicCapb) {
                $scope.room.Topic = topic;
                $scope.room.TopicId = topicId;
                $scope.room.TopicDesc = topicDesc;
                $scope.room.TopicCapability = topicCapb;
                $scope.$apply();
            };
            this._poker.client.showAllCards = function (show) {
                $scope.allCardsShowing = show;
                $scope.$apply();
            };
            this._poker.client.resetRoom = function (room) {
                $scope.room = room;
                $scope.myCard.Value = "";
                $scope.$apply();
            };
            this._poker.client.selectedEstimateValue = function (room) {
                $scope.room = room;
                $scope.$apply();
            };
            this._poker.client.reEstimate = function (room) {
                $scope.room = room;
                $scope.allCardsShowing = false;
                $scope.$apply();
            };
            this._poker.client.addNextEstimate = function (room) {
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
                        }
                        else {
                            $scope.joinRoomModal = true;
                            $scope.$apply();
                        }
                    });
                }
                else {
                    $scope.joinModal = true;
                    $scope.$apply();
                }
            });
        }
        Object.defineProperty(PokerRoomCtrl.prototype, "myCard", {
            get: function () {
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
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PokerRoomCtrl.prototype, "me", {
            get: function () {
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
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PokerRoomCtrl.prototype, "room", {
            get: function () {
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
            },
            enumerable: true,
            configurable: true
        });
        //#region Client
        PokerRoomCtrl.prototype.userChanged = function (user) {
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
        };
        PokerRoomCtrl.prototype.userRemoved = function (user) {
            var found = false;
            if (user.Email === this.$scope.me.Email) {
                this.$scope.room = null;
                this.$scope.myCard = null;
                this.$location.path("");
                this.$scope.joinRoomModal = true;
            }
            else {
                this.$scope.room.Users = this.$scope.room.Users.filter(function (roomUser) {
                    return user.Email !== roomUser.Email;
                });
                this.$scope.room.Cards = this.$scope.room.Cards.filter(function (roomCard) {
                    return user.Email !== roomCard.User.Email;
                });
            }
            this.$scope.$apply();
        };
        PokerRoomCtrl.prototype.cardChanged = function (card, room) {
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
        };
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
        PokerRoomCtrl.prototype.join = function (user) {
            if (user === void 0) { user = this.me; }
            var that = this;
            return this._poker.server.join(user).done(function (data) {
                that.$scope.me = data;
                that.$scope.$apply();
            });
        };
        PokerRoomCtrl.prototype.joinRoom = function (room) {
            if (room === void 0) { room = this.room; }
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
        };
        PokerRoomCtrl.prototype.leaveRoom = function (user) {
            if (user === void 0) { user = this.me; }
            return this._poker.server.leaveRoom(this.room, user);
        };
        PokerRoomCtrl.prototype.resetRoom = function () {
            return this._poker.server.resetRoom(this.room);
        };
        PokerRoomCtrl.prototype.showAllCards = function (show) {
            if (show === void 0) { show = true; }
            return this._poker.server.showAllCards(this.room, show);
        };
        PokerRoomCtrl.prototype.changeRoomTopic = function (topic, topicId, topicDesc, topicCapb) {
            return this._poker.server.changeRoomTopic(this.room, topic, topicId, topicDesc, topicCapb);
        };
        PokerRoomCtrl.prototype.changedMyCardValue = function (value) {
            return this._poker.server.changedCard(this.room, value);
        };
        PokerRoomCtrl.prototype.selectedEstimateValue = function (value) {
            return this._poker.server.selectedEstimateValue(value, this.room);
        };
        PokerRoomCtrl.prototype.addNextEstimate = function () {
            return this._poker.server.addNextEstimate(this.room);
        };
        PokerRoomCtrl.prototype.reEstimate = function (story) {
            return this._poker.server.reEstimate(story, this.room);
        };
        // protect the injection from minification
        PokerRoomCtrl.$inject = ['$scope', '$location', '$cookies'];
        return PokerRoomCtrl;
    }());
    Consensus.PokerRoomCtrl = PokerRoomCtrl;
    // setup controller
    app.controller("PokerRoomCtrl", PokerRoomCtrl);
    var PokerUser = (function () {
        function PokerUser() {
        }
        return PokerUser;
    }());
    Consensus.PokerUser = PokerUser;
    var PokerRoom = (function () {
        function PokerRoom() {
        }
        return PokerRoom;
    }());
    Consensus.PokerRoom = PokerRoom;
    var PokerCard = (function () {
        function PokerCard() {
        }
        return PokerCard;
    }());
    Consensus.PokerCard = PokerCard;
    var StoryEstimate = (function () {
        function StoryEstimate() {
        }
        return StoryEstimate;
    }());
    Consensus.StoryEstimate = StoryEstimate;
})(Consensus || (Consensus = {}));
//# sourceMappingURL=consensus.pokerRoom.js.map