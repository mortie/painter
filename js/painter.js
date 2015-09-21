(function() {

	function average(num1, num2) {
		return (num1 + num2) / 2;
	}

	//class Point {
		function Point(x, y) {
			this.x = x;
			this.y = y;
		}

		Point.prototype.draw = function(ctx) {
			var oldFillStyle = ctx.fillStyle;
			ctx.fillStyle = ctx.strokeStyle;

			ctx.beginPath();
			ctx.arc(this.x, this.y, ctx.lineWidth / 2, 0, 2 * Math.PI, false);
			ctx.fill();

			ctx.fillStyle = oldFillStyle;
		};
	//}

	//class Freehand {
		function Freehand() {
			this.type = "Freehand";
			this.points = [];
		}

		Freehand.prototype.addPoint = function(point) {
			this.points.push(point);
		};

		Freehand.prototype.draw = function(ctx) {
			var points = this.points;

			points[0].draw(ctx);

			ctx.beginPath();
			ctx.moveTo(points[0].x, points[0].y);
			for (var i = 1; i < points.length; ++i) {
				ctx.lineTo(points[i].x, points[i].y);
			}
			ctx.stroke();

			points[points.length - 1].draw(ctx);
		};
	//}

	//class Rectangle {
		function Rectangle(x, y) {
			this.type = "Rectangle";
			this.start = new Point(x, y);
			this.end = new Point(x, y);
		}
		Rectangle.prototype.setEnd = function(x, y) {
			this.end = new Point(x, y);
		};
		Rectangle.prototype.draw = function(ctx) {
			var width = this.end.x - this.start.x;
			var height = this.end.y - this.start.y;

			ctx.beginPath();
			ctx.rect(this.start.x, this.start.y, width, height);
			ctx.stroke();
			ctx.fill();
		};
	//}
	
	//class Circle {
		function Circle(x, y) {
			this.type = "Circle";
			this.pos = new Point(x, y);
			this.rad = 0;
		}

		Circle.prototype.setRadius = function(rad) {
			this.rad = rad;
		};

		Circle.prototype.draw = function(ctx) {
			ctx.beginPath();
			ctx.arc(this.pos.x, this.pos.y, this.rad, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.fill();
		};
	//}

	//class Painter {
		window.Painter = function(canvas) {
			this.canvas = canvas;
			this.ctx = canvas.getContext("2d");
			this.styles = {};
			this.elements = [];
			this.trash = [];
			this.offsetY = canvas.offsetTop;
			this.inTouchLine = false;
			this.camera = new Point(0, 0);

			canvas.addEventListener("mousedown", function(evt) {
				if (this.mode === "freehand")
					this.startMouse("paintFreehand", evt);
				else if (this.mode === "square")
					this.startMouse("paintSquare", evt);
				else if (this.mode === "circle")
					this.startMouse("paintCircle", evt);
				else if (this.mode === "translate")
					this.startMouse("paintTranslate", evt);
				else
					alert("nuu");
			}.bind(this));

			canvas.addEventListener("touchstart", function(evt) {
				if (this.mode === "freehand")
					this.startTouch("paintFreehand", evt);
				else if (this.mode === "square")
					this.startTouch("paintSquare", evt);
				else if (this.mode === "circle")
					this.startTouch("paintCircle", evt);
				else if (this.mode === "translate")
					this.startTouch("paintTranslate", evt);
				else
					alert("nuu");
			}.bind(this));
		};

		Painter.prototype.setCamera = function(x, y) {
			this.ctx.translate(-this.camera.x, -this.camera.y);
			this.camera = new Point(x, y);
			this.ctx.translate(x, y);
			this.draw();
		};
		Painter.prototype.translateCamera = function(x, y) {
			this.camera.x += x;
			this.camera.y += y;
			this.ctx.translate(x, y);
			this.draw();
		};

		Painter.prototype.paintFreehand = function(obj) {
			var self = this;
			var elem = new Freehand();
			this.elements.push(elem);
			elem.addPoint(new Point(obj.x, obj.y));

			obj.elem = elem;

			obj.onmove = function(x, y) {
				elem.addPoint(new Point(x, y));
				elem.draw(self.ctx);
			};

			obj.onend = function() {
				self.draw();
			};
		};
		Painter.prototype.paintSquare = function(obj) {
			var self = this;
			var elem = new Rectangle(obj.x, obj.y);
			this.elements.push(elem);

			obj.elem = elem;

			obj.onmove = function(x, y) {
				elem.setEnd(x, y);
				self.draw();
			};

			obj.onend = function() {
				self.draw();
			};
		};
		Painter.prototype.paintCircle = function(obj) {
			var self = this;
			var elem = new Circle(obj.x, obj.y);
			var pos = elem.pos;
			this.elements.push(elem);

			obj.elem = elem;

			obj.onmove = function(x, y) {
				elem.setRadius(Math.sqrt(
					Math.pow(pos.x - x, 2) +
					Math.pow(pos.y - y, 2)
				) / 1.5);

				self.draw();
			};

			obj.onend = function() {
				self.draw();
			};
		};
		Painter.prototype.paintTranslate = function(obj, raw) {
			var self = this;
			var old = raw;
			var vel = new Point();

			obj.onmove = function(x, y, raw) {
				vel.x = vel.x ? average(raw.x - old.x, vel.x) : raw.x - old.x;
				vel.y = vel.y ? average(raw.y - old.y, vel.y) : raw.y - old.y;

				self.translateCamera(raw.x - old.x, raw.y - old.y);

				old = raw;
			};

			obj.onend = function() {
				var interval = setInterval(function() {
					vel.x *= 0.87;
					vel.y *= 0.87;

					self.translateCamera(vel.x, vel.y);

					if (vel.x < 0.1 && vel.y < 0.1)
						clearInterval(interval);
				}, 1000/60);
			};
		};

		Painter.prototype.startMouse = function(name, evt) {
			var self = this;
			if (this.inTouchLine)
				return;

			var obj = {
				x: evt.offsetX - self.camera.x,
				y: evt.offsetY - self.camera.y,
			};

			this[name](obj, new Point(evt.offsetX, evt.offsetY));

			function onMouseMove(evt) {
				evt.preventDefault();

				if (obj.elem)
					self.setStyles(obj.elem);

				if (obj.onmove) {
					obj.onmove(
						evt.offsetX - self.camera.x,
						evt.offsetY - self.camera.y,
						new Point(evt.offsetX, evt.offsetY)
					);
				}
			}

			function onMouseUp(evt) {
				evt.preventDefault();

				if (obj.onend)
					obj.onend(evt);

				canvas.removeEventListener("mousemove", onMouseMove);
				canvas.removeEventListener("mouseup", onMouseUp);
			}

			canvas.addEventListener("mousemove", onMouseMove);
			canvas.addEventListener("mouseup", onMouseUp);
		};

		Painter.prototype.startTouch = function(name, evt) {
			var self = this;
			this.inTouchLine = true;
			var touch = evt.changedTouches[0];

			var obj = {
				x: touch.pageX - self.camera.x,
				y: touch.pageY - self.camera.y - self.offsetY
			};

			this[name](obj, new Point(touch.pageX, touch.pageY));

			function onTouchMove(evt) {
				var t;

				for (var i in evt.changedTouches) {
					var cTouch = evt.changedTouches[i];
					if (cTouch.identifier === touch.identifier)
						t = cTouch;
				}

				if (t === undefined)
					return;

				evt.preventDefault();

				if (obj.elem)
					self.setStyles(obj.elem);

				if (obj.onmove) {
					obj.onmove(
						t.pageX - self.camera.x,
						t.pageY - self.camera.y - self.offsetY,
						new Point(t.pageX, t.pageY)
					);
				}
			}

			function onTouchEnd(evt) {
				var t = evt.changedTouches[0];

				if (t.identifier !== touch.identifier)
					return;

				canvas.removeEventListener("touchmove", onTouchMove);
				canvas.removeEventListener("touchend", onTouchEnd);
				evt.preventDefault();

				if (obj.onend)
					obj.onend();

				this.inTouchLine = false;
			}

			canvas.addEventListener("touchmove", onTouchMove);
			canvas.addEventListener("touchend", onTouchEnd);
		};

		Painter.prototype.setStyle = function(key, val) {
			this.styles[key] = val;
		};
		Painter.prototype.setMode = function(mode) {
			this.canvas.className = this.canvas.className.replace(" mode-"+this.mode, "");
			this.canvas.className += " mode-"+mode;
			this.mode = mode;
		};

		Painter.prototype.undo = function() {
			if (this.elements.length > 0) {
				this.trash.push(this.elements.pop());
				this.draw();
			}
		};
		Painter.prototype.redo = function() {
			if (this.trash.length > 0) {
				this.elements.push(this.trash.pop());
				this.draw();
			}
		};

		Painter.prototype.draw = function() {
			var ctx = this.ctx;
			ctx.clearRect(
				-this.camera.x,
				-this.camera.y,
				this.canvas.width,
				this.canvas.height
			);

			this.elements.forEach(function(elem) {
				ctx.save();

				this.setStyles(elem);
				elem.draw(ctx);

				ctx.restore();
			}.bind(this));
		};

		Painter.prototype.setStyles = function(obj, immutable) {
			if (obj.styles === undefined) {
				obj.styles = {};
				if (!immutable) {
					for (var i in this.styles) {
						obj.styles[i] = this.styles[i];
					}
				}
			}

			this.ctx.lineWidth = obj.styles.lineWidth || undefined;
			this.ctx.strokeStyle = obj.styles.strokeStyle || undefined;
			if (obj.styles.lineWidth === "0")
				this.ctx.strokeStyle = "rgba(0, 0, 0, 0)";
			this.ctx.fillStyle = obj.styles.fillStyle || undefined;
		};
	//}
})();
