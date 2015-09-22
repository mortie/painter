(function() {

	function average(num1, num2) {
		return (num1 + num2) / 2;
	}

	function diff(num1, num2) {
		return Math.abs(num1 - num2);
	}

	//class Overlay {
		function Overlay() {
			var self = this;
			this.visible = false;
			this.elem = null;

			function menuEntry(key, name) {
				var li = document.createElement("li");
				li.innerHTML = name;
				li.style.cssText =
					"cursor: pointer";
				li.onclick = function() {
					if (self["click"+key])
						self["click"+key]();
				};
				return li;
			}

			this.pos = new Point();
			this.camera = new Point();

			this.boundingElem = document.createElement("div");
			this.boundingElem.style.cssText =
				"pointer-events: none;"+
				"box-sizing: content-box;"+
				"border: 1px solid black;"+
				"width: 0px;"+
				"height: 0px";

			this.menuElem = document.createElement("ul");
			this.menuElem.appendChild(menuEntry("delete", "Delete"));
			this.menuElem.style.cssText =
				"box-sizing: border-box;"+
				"display: inline-block;"+
				"background: white;"+
				"border: 1px solid black;"+
				"border-radius: 20px;"+
				"padding: 5px;"+
				"list-style-type: none";

			this.containerElem = document.createElement("div");
			this.containerElem.style.cssText =
				"position: fixed;"+
				"top: 0px;"+
				"left: 0px;"+
				"height: 0px;"+
				"display: none";
			this.containerElem.appendChild(this.boundingElem);
			this.containerElem.appendChild(this.menuElem);

			document.body.appendChild(this.containerElem);
		}

		Overlay.prototype.update = function(offset) {
			this.containerElem.style.left = (this.pos.x + this.camera.x + offset.x - 6) + "px";
			this.containerElem.style.top = (this.pos.y + this.camera.y + offset.y - 6) + "px";
		};

		Overlay.prototype.show = function(elem, offset) {
			this.visible = true;
			this.elem = elem;
			var rect = elem.getBoundingRect();

			this.pos.x = rect.start.x;
			this.pos.y = rect.start.y;

			this.containerElem.style.left = (this.camera.x + rect.start.x + offset.x - 6) + "px";
			this.containerElem.style.top = (this.camera.y + rect.start.y + offset.y - 6) + "px";
			this.containerElem.style.display = "block";

			this.boundingElem.style.width = (rect.end.x - rect.start.x + 10) + "px";
			this.boundingElem.style.height = (rect.end.y - rect.start.y + 10) + "px";
		};

		Overlay.prototype.hide = function() {
			this.visible = false;
			this.elem = null;
			this.containerElem.style.display = "none";
		};
	//}

	//class Point {
		function Point(x, y) {
			this.x = x || 0;
			this.y = y || 0;
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

		Freehand.prototype.addPoint = function(point, ctx) {
			this.points.push(point);

			var prevPoint = this.points[this.points.length - 2];
			if (prevPoint === undefined)
				return;

			ctx.beginPath();
			ctx.moveTo(prevPoint.x, prevPoint.y);
			ctx.lineTo(point.x, point.y);
			ctx.stroke();
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

		Freehand.prototype.isIntersected = function(x, y) {
			var rect = this.getBoundingRect();

			if (
				x >= rect.start.x && x <= rect.end.x &&
				y >= rect.start.y && y <= rect.end.y
			) {
				return true;
			}

			return false;
		};

		Freehand.prototype.getBoundingRect = function() {
			var firstPoint = this.points[0];
			var lwidth = parseInt(this.styles.lineWidth) / 2 || 0;

			var start = new Point(firstPoint.x, firstPoint.y);
			var end = new Point(firstPoint.x, firstPoint.y);

			this.points.forEach(function(point) {
				if (point.x - lwidth < start.x)
					start.x = point.x - lwidth;
				if (point.y - lwidth < start.y)
					start.y = point.y - lwidth;
				if (point.x + lwidth > end.x)
					end.x = point.x + lwidth;
				if (point.y + lwidth > end.y)
					end.y = point.y + lwidth;
			});

			return {
				start: start,
				end: end
			};
		};

		Freehand.prototype.translate = function(x, y) {
			this.points.forEach(function(point) {
				point.x += x;
				point.y += y;
			});
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

		Rectangle.prototype.isIntersected = function(x, y) {
			if (
				x >= this.start.x && x <= this.end.x &&
				y >= this.start.y && y <= this.end.y
			) {
				return true;
			}

			return false;
		};

		Rectangle.prototype.getBoundingRect = function() {
			var lwidth = parseInt(this.styles.lineWidth) / 2 || 0;

			return {
				start: new Point(this.start.x - lwidth, this.start.y - lwidth),
				end: new Point(this.end.x + lwidth, this.end.y + lwidth)
			};
		};

		Rectangle.prototype.translate = function(x, y) {
			this.start.x += x;
			this.start.y += y;
			this.end.x += x;
			this.end.y += y;
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

		Circle.prototype.isIntersected = function(x, y) {
			if (
				Math.pow(x - this.pos.x, 2) +
				Math.pow(y - this.pos.y, 2) <=
				this.rad * this.rad
			) {
				return true;
			}

			return false;
		};

		Circle.prototype.getBoundingRect = function() {
			var lwidth = parseInt(this.styles.lineWidth) / 2 || 0;
			var offset = this.rad + lwidth;

			return {
				start: new Point(this.pos.x - offset, this.pos.y - offset),
				end: new Point(this.pos.x + offset, this.pos.y + offset)
			};
		};

		Circle.prototype.translate = function(x, y) {
			this.pos.x += x;
			this.pos.y += y;
		};
	//}

	//class Painter {
		window.Painter = function(canvas) {
			this.canvas = canvas;
			this.ctx = canvas.getContext("2d");
			this.styles = {};
			this.elements = [];
			this.trash = [];
			this.offset = new Point(canvas.offsetLeft, canvas.offsetTop);
			this.inTouchLine = false;
			this.camera = new Point(0, 0);
			this.overlay = new Overlay();
			this.overlay.camera = this.camera;

			window.addEventListener("resize", function() {
				this.offset.x = canvas.offsetLeft;
				this.offset.y = canvas.offsetTop;
				this.draw();
			}.bind(this));

			canvas.addEventListener("mousedown", function(evt) {
				if (this.mode === "freehand")
					this.startMouse("paintFreehand", evt);
				else if (this.mode === "rectangle")
					this.startMouse("paintRectangle", evt);
				else if (this.mode === "circle")
					this.startMouse("paintCircle", evt);
				else if (this.mode === "translate")
					this.startMouse("paintTranslate", evt);
				else if (this.mode === "select")
					this.startMouse("paintSelect", evt);
				else
					alert("nuu");
			}.bind(this));

			canvas.addEventListener("touchstart", function(evt) {
				if (this.mode === "freehand")
					this.startTouch("paintFreehand", evt);
				else if (this.mode === "rectangle")
					this.startTouch("paintRectangle", evt);
				else if (this.mode === "circle")
					this.startTouch("paintCircle", evt);
				else if (this.mode === "translate")
					this.startTouch("paintTranslate", evt);
				else if (this.mode === "select")
					this.startTouch("paintSelect", evt);
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

			var prev = new Point(obj.x, obj.y);
			var prevTime = new Date().getTime();

			obj.elem = elem;

			obj.onmove = function(x, y) {
				if (
					(diff(x, prev.x) > 10) ||
					(diff(y, prev.y) > 10) ||
					(diff(new Date().getTime(), prevTime) > 100)
				) {
					prev.x = x;
					prev.y = y;
					elem.addPoint(new Point(x, y), self.ctx);
					prevTime = new Date().getTime();
				}
			};

			obj.onend = function() {
				self.draw();
			};
		};
		Painter.prototype.paintRectangle = function(obj) {
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

			obj.onmove = function(x, y, raw) {
				self.translateCamera(raw.x - old.x, raw.y - old.y);
				self.overlay.update(self.offset);

				old = raw;
			};
		};
		Painter.prototype.paintSelect = function(obj, raw) {
			var self = this;
			var old = raw;

			//If the touched element is already selected, we move it around
			if (self.overlay.elem && self.overlay.elem.isIntersected(obj.x, obj.y)) {
				obj.onmove = function(x, y, raw) {
					self.overlay.elem.translate(raw.x - old.x, raw.y - old.y);
					self.overlay.show(self.overlay.elem, self.offset);
					self.draw();

					old = raw;
				};
				return;
			}

			//We're not touching an already selected element,
			//so we try to select a new element

			var elem;

			for (var i = self.elements.length - 1; i >= 0; --i) {
				if (self.elements[i].isIntersected(obj.x, obj.y)) {
					elem = self.elements[i];
					break;
				}
			}

			obj.onend = function(x, y) {
				if (!elem || !elem.isIntersected(x, y)) {
					self.overlay.hide();
					return;
				}

				self.overlay.show(elem, self.offset);

				self.overlay.clickdelete = function() {
					var i = self.elements.indexOf(elem);
					self.elements.splice(i, 1);
					self.draw();
					self.overlay.hide();
				};
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

				if (obj.onend) {
					obj.onend(
						evt.offsetX - self.camera.x,
						evt.offsetY - self.camera.y,
						new Point(evt.offsetX, evt.offsetY)
					);
				}

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
				x: touch.pageX - self.camera.x - self.offset.x,
				y: touch.pageY - self.camera.y - self.offset.y
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
						t.pageX - self.camera.x - self.offset.x,
						t.pageY - self.camera.y - self.offset.y,
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

				if (obj.onend) {
					obj.onend(
						t.pageX - self.camera.x - self.offset.x,
						t.pageY - self.camera.y - self.offset.y,
						new Point(t.pageX, t.pageY)
					);
				}

				this.inTouchLine = false;
			}

			canvas.addEventListener("touchmove", onTouchMove);
			canvas.addEventListener("touchend", onTouchEnd);
		};

		Painter.prototype.setStyle = function(key, val) {
			this.styles[key] = val;
		};
		Painter.prototype.setMode = function(mode) {
			this.overlay.hide();
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
		Painter.prototype.clear = function() {
			this.trash = [];
			this.elements = [];
			this.draw();
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
