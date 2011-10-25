/* simulation of cooperative behavior */
var birds;

var jsCoop = {
    readSettings: function() {
        this.maxGroups = parseInt($('#maxGroups').val()) || 0;
        this.groupChance = parseFloat($('#groupChance').val()) || 0;
        this.numCreatures = parseFloat($('#numCreatures').val()) || 0;
        this.numFood = parseFloat($('#numFood').val()) || 0;
    },
    prepareScreen: function() {
        $('#setup').hide();
        $('<div id="food"></div>').appendTo('body');
    },
    run: function() {
        this.readSettings();
        this.prepareScreen();
        var gameHeight = window.innerHeight;
        var gameWidth = window.innerWidth;
        var midY = gameHeight / 2;

        var groupHeight = gameHeight / this.maxGroups;
        var halfGroupHeight = groupHeight / 2;
        var scene = sjs.Scene({
            w: gameWidth,
            h: gameHeight
        });

        var collisionWeightFactor = 0.3;
        var foodAttractionFactor = 0.4;
        var nestAttractionFactor = 0.4;
        var mouseAttractionFactor = 0.5;

        var layer = scene.Layer("flock");

        birds = sjs.SpriteList();

        var addPellet = function(container) {
            container.append('<div class="pellet"/>');
        }
        var drawGroup = function(group) {
            var g = $('<div class="nest"/>').appendTo('body');

            g.css('background-color', group.color);
            g.css('top', group.centerY - halfGroupHeight);
        }

        var food = $('#food').css('left', gameWidth - 200);

        for (var i = 0, ub = this.numFood; i < ub; i++) {
            addPellet(food);
        };
        var input = scene.Input();
        var nbb = this.numCreatures;

        var groups = {};

        for (var i = 0; i < nbb; i++) {
            var bird = scene.Sprite('bird.png', {
                layer: layer
            });
            bird.move(0.8 * gameWidth * Math.random() + 20, 0.8 * gameHeight * Math.random());
            bird.size(32, 32);
            bird.mass = 0.9;
            bird.friction = 0.2;
            bird.update();
            birds.add(bird);
        }

        function paint() {

            var mouseX = input.mouse.position.x;
            var mouseY = input.mouse.position.y;

            var bird = null;
            var lastBird = null;
            while (bird = birds.iterate()) {
                //reset forces
                var xf = 0;
                var yf = 0;

                //collisions with other birds
                var collide = bird.collidesWithArray(birds);
                if (collide) {
                    var a = bird;
                    var b = collide;
                    var colx = a.x - b.x;
                    var coly = a.y - b.y;
                    var ncol = sjs.math.hypo(colx, coly);

                    if (ncol == 0)
                    ncol = 1;

                    //just add a repulsive force
                    xf += 0.1 * colx / ncol;
                    yf += 0.1 * coly / ncol;
                    bird.addForce(xf, yf);
                    collide.addForce( - xf, -yf);

                    if (! (a.group && b.group) && Math.random() < jsCoop.groupChance) {
                        if (a.group && !b.group) {
                            b.group = a.group;
                            b.setColor(groups[a.group].color);
                        }
                        else if (b.group && !a.group) {
                            a.group = b.group;
                            a.setColor(groups[b.group].color);
                        }
                        else if (!a.group && !b.group) {

                            var formGroup = Math.random() > 0.1;
                            if (formGroup) {
                                var newGroupIndex = Object.keys(groups).length + 1;
                                if (newGroupIndex <= jsCoop.maxGroups) {
                                    var newGroupKey = newGroupIndex + '';
                                    function randomPart() {
                                        return parseInt(Math.random() * 255);
                                    }


                                    var group = {
                                        color: 'rgba(' + randomPart() + ',' + randomPart() + ',' + randomPart() + ',1)',
                                        centerY: ((newGroupIndex - 1) * groupHeight) + halfGroupHeight
                                    }

                                    console.log(group.centerY);
                                    groups[newGroupKey] = group
                                    a.group = newGroupKey;
                                    b.group = newGroupKey;
                                    a.setColor(group.color);
                                    b.setColor(group.color);
                                    drawGroup(group);
                                }
                            }
                        }
                    }

                }



                var targetX,
                targetY;


                if (bird.hasFood) {
                    var attractionWeight = foodAttractionFactor;
                    targetX = 10;
                    if (bird.group) {
                        targetY = groups[bird.group].centerY;
                    }
                    else {
                        targetY = midY;
                    }
                }
                else {
                    attractionWeight = nestAttractionFactor;
                    targetX = gameWidth - 10;
                    targetY = midY;
                }

                var tx = targetX - bird.x;
                var ty = targetY - bird.y;
                var tn = sjs.math.hypo(tx, ty);

                tx = attractionWeight * tx / tn;
                ty = attractionWeight * ty / tn;


                if (tn < 10) {

                    if (bird.hasFood) {
                        if (bird.group) {
                            var nest = $('.nest')[parseInt(bird.group) - 1];
                            //todo use a data attribute instead of relying on order matching
                            if (nest) {
                                addPellet($(nest));
                            }
                        }
                        var nestIndex = bird
                    }
                    else {
                        $('#food .pellet:first').remove()
                    }
                    bird.hasFood = !bird.hasFood;
                }
                else {
                    bird.addForce(tx, ty);
                }

                var tx = mouseX - bird.x;
                var ty = mouseY - bird.y;
                var tn = sjs.math.hypo(tx, ty);


                if (tn > 10 && input.mousedown) {
                    tx = mouseAttractionFactor * tx / tn;
                    ty = mouseAttractionFactor * ty / tn;
                    bird.addForce(tx, ty);
                } else if (lastBird) {
                    var tx = lastBird.x - bird.x;
                    var ty = lastBird.y - bird.y;
                    var tn = sjs.math.hypo(tx, ty);
                    tx = collisionWeightFactor * tx / tn;
                    ty = collisionWeightFactor * ty / tn;
                    bird.addForce(tx, ty);
                }

                // reduce the force
                if (Math.abs(bird.xf) > 0.2)
                bird.xf = bird.xf / 1.2;
                if (Math.abs(bird.yf) > 0.2)
                bird.yf = bird.yf / 1.2;
                // orient the sprite
                bird.orient(bird.xv, bird.yv);
                // apply the forces
                bird.applyForce(1);
                bird.applyVelocity(1);
                bird.update();
                lastBird = bird;
            }

        }

        var ticker = scene.Ticker(30, paint);
        ticker.run();
    }
}