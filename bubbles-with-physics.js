(($) => {
    var bubbles = { };

    /**
     * Tracks a bubble as it is rubberbanded or moved across the drawing area.
     */
    let trackDrag = (event) => {
      // when in draw, trackDrag renders the bubble with varying size
        $.each(event.changedTouches, function (index, touch) {
            if (touch.target.movingBubble) {
                // Reposition the object.
                let newPosition = {
                    left: touch.pageX - touch.target.deltaX,
                    top: touch.pageY - touch.target.deltaY
                };

                // Delete a bubble
                if ((newPosition.left <= 25) && (newPosition.top <= 25)) {
                    touch.target.remove();
                }

                // Color the bubbles
                if ((newPosition.left <= 320 && newPosition.left >= 200) && (newPosition.top <= 50 && newPosition.top >= 0)) {
                    $(touch.target).css("background","red");
                } else if ((newPosition.left <= 320 && newPosition.left >= 200) && (newPosition.top <= 90 && newPosition.top >= 60)) {
                    $(touch.target).css("background", "orange");
                } else if ((newPosition.left <= 320 && newPosition.left >= 200) && (newPosition.top <= 140 && newPosition.top >= 110)) {
                    $(touch.target).css("background", "yellow");
                } else if ((newPosition.left <= 320 && newPosition.left >= 200) && (newPosition.top <= 190 && newPosition.top >= 160)) {
                    $(touch.target).css("background", "green");
                } else if ((newPosition.left <= 320 && newPosition.left >= 200) && (newPosition.top <= 240 && newPosition.top >= 210)) {
                    $(touch.target).css("background", "blue");
                } else if ((newPosition.left <= 320 && newPosition.left >= 200) && (newPosition.top <= 290 && newPosition.top >= 260)) {
                    $(touch.target).css("background", "purple");
                } else if ((newPosition.left <= 320 && newPosition.left >= 200) && (newPosition.top <= 340 && newPosition.top >= 310)) {
                    $(touch.target).css("background", "black");
                } else if ((newPosition.left <= 320 && newPosition.left >= 200) && (newPosition.top <= 390 && newPosition.top >= 360)) {
                    $(touch.target).css("background", "white");
                }

                $(touch.target).data('position', newPosition);
                touch.target.movingBubble.offset(newPosition);
            }
        });
        event.preventDefault();
    };

    /**
     * Concludes a drawing or moving sequence.
     */
    let endDrag = (event) => {
        $.each(event.changedTouches, (index, touch) => {
            let bubble = bubbles[touch.identifier];
            if (bubble && bubble.circle) {
              console.log("triggerEndDraw");
              if (bubbles[touch.identifier]) {
                console.log("deleting timer");
                clearInterval(bubbles[touch.identifier].timer);
              }
              bubble.circle
                .removeClass("bubble-highlight")
                .bind("touchstart", startMove)
                .bind("touchend", unhighlight);
              delete(bubbles[touch.identifier]);
            }
            if (touch.target.movingBubble) {
              touch.target.movingBubble = null;
            }
        });
        event.preventDefault();
    };

    /**
     * Indicates that an element is unhighlighted.
     */
    let unhighlight = (event) => $(event.currentTarget).removeClass("bubble-highlight");

    let startDraw = (event) => {
      $.each(event.changedTouches, (index, touch) => {
        this.left = touch.pageX;
        this.top = touch.pageY;

        bubbles[touch.identifier] = {
          circle : $("<div></div>")
            .appendTo(".drawing-area")
            .addClass("circle")
            .addClass("bubble-highlight")
            .offset({left: touch.pageX, top: touch.pageY})
            .data({
              position: {left: touch.pageX, top: touch.pageY},
              velocity: { x: 0, y: 0, z: 0 },
              acceleration: { x: 0, y: 0, z: 0 }
            }),
          timer: 0,
          currentScale : 0
        }

        let bubbleState = bubbles[touch.identifier];

        if (bubbleState) {
          bubbleState.timer = setInterval(function () {
            bubbleState.currentScale = ++ bubbleState.currentScale % 60;
            $(bubbleState.circle).css({"height":  75 + bubbleState.currentScale * 10, "width": 75 + bubbleState.currentScale * 10});
            if (bubbleState.currentScale > 25) {
              bubbleState.currentScale = 25;
            };
          }, 200);
        }
      });
      console.log(bubbles);
      event.preventDefault();
    }

    /**
     * Begins a bubble move sequence.
     */
    let startMove = (event) => {
      // alert("trigger start move");
        $.each(event.changedTouches, (index, touch) => {
            // Highlight the element.
            $(touch.target).addClass("bubble-highlight");

            // Take note of the bubble's current (global) location. Also, set its velocity and acceleration to
            // nothing because, well, _finger_.
            let jThis = $(touch.target);
            let startOffset = jThis.offset();
            jThis.data({
                position: startOffset,
                velocity: { x: 0, y: 0, z: 0 },
                acceleration: { x: 0, y: 0, z: 0 }
            });

            // Set the drawing area's state to indicate that it is
            // in the middle of a move.
            touch.target.movingBubble = jThis;
            touch.target.deltaX = touch.pageX - startOffset.left;
            touch.target.deltaY = touch.pageY - startOffset.top;
        });

        // Eat up the event so that the drawing area does not
        // deal with it.
        event.stopPropagation();
        event.preventDefault();
    };

    /**
     * The motion update routine.
     */
    const FRICTION_FACTOR = 0.99;
    const ACCELERATION_COEFFICIENT = 0.05;
    const FRAME_RATE = 120;
    const FRAME_DURATION = 1000 / FRAME_RATE;

    let lastTimestamp = 0;
    let updateBubbles = (timestamp) => {
        if (!lastTimestamp) {
            lastTimestamp = timestamp;
        }

        // Keep that frame rate under control.
        if (timestamp - lastTimestamp < FRAME_DURATION) {
            window.requestAnimationFrame(updateBubbles);
            return;
        }

        $(".circle").each((index, element) => {
            let $element = $(element);
            // If it's highlighted, we don't accelerate it because it is under a finger.
            if ($element.hasClass("bubble-highlight")) {
                return;
            }

            let s = $element.data('position');
            let v = $element.data('velocity');
            let a = $element.data('acceleration');

            // The standard update-bounce sequence.
            s.left += v.x;
            s.top -= v.y;

            v.x += (a.x * ACCELERATION_COEFFICIENT);
            v.y += (a.y * ACCELERATION_COEFFICIENT);
            v.z += (a.z * ACCELERATION_COEFFICIENT);

            v.x *= FRICTION_FACTOR;
            v.y *= FRICTION_FACTOR;
            v.z *= FRICTION_FACTOR;

            let $parent = $element.parent();
            let bounds = {
                left: $parent.offset().left,
                top: $parent.offset().top
            };

            bounds.right = bounds.left + $parent.width();
            bounds.bottom = bounds.top + $parent.height();

            if ((s.left <= bounds.left) || (s.left + $element.width() > bounds.right)) {
                s.left = (s.left <= bounds.left) ? bounds.left : bounds.right - $element.width();
                v.x = -v.x;
            }
            if ((s.top <= bounds.top) || (s.top + $element.height() > bounds.bottom)) {
                s.top = (s.top <= bounds.top) ? bounds.top : bounds.bottom - $element.height();
                v.y = -v.y;
            }
            $(element).offset(s);
        });

        lastTimestamp = timestamp;
        window.requestAnimationFrame(updateBubbles);
    };

    /**
     * Sets up the given jQuery collection as the drawing area(s).
     */
    let setDrawingArea = (jQueryElements) => {
        // Set up any pre-existing bubble elements for touch behavior.
        jQueryElements
            .addClass("drawing-area")

            // Event handler setup must be low-level because jQuery
            // doesn't relay touch-specific event properties.
            .each((index, element) => {
                element.addEventListener("touchmove", trackDrag, false);
                element.addEventListener("touchend", endDrag, false);
                element.addEventListener("touchstart", startDraw, false);
                element.addEventListener("touchleave", endDrag, false);
            })

            .find(".circle").each((index, element) => {
                element.addEventListener("touchstart", startMove, false);
                element.addEventListener("touchend", unhighlight, false);

                $(element).data({
                    position: $(element).offset(),
                    velocity: { x: 0, y: 0, z: 0 },
                    acceleration: { x: 0, y: 0, z: 0 }
                });
            });

        // In this sample, device acceleration is the _sole_ determiner of a bubble's acceleration.
        window.ondevicemotion = (event) => {
            let a = event.accelerationIncludingGravity;
            $(".circle").each((index, element) => {
                $(element).data('acceleration', a);
            });
        };
        // Start the animation sequence.
        window.requestAnimationFrame(updateBubbles);
    };

    // No arrow function here because we don't want lexical scoping.
    $.fn.bubblesWithPhysics = function () {
        setDrawingArea(this);
        return this;
    };
})(jQuery);
