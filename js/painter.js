(function() {

	function average(num1, num2) {
		return (num1 + num2) / 2;
	}

	function diff(num1, num2) {
		return Math.abs(num1 - num2);
	}

	function clone(obj) {
		if (typeof obj != "object")
			return obj;

		var res = Object.create(obj);

		for (var i in obj) {
			if (!obj.hasOwnProperty(i))
				continue;

			res[i] = clone(obj[i]);
		}

		return res;
	}

	//class Overlay {
		function Overlay(painter) {
			var self = this;
			this.visible = false;
			this.elem = null;
			this.painter = painter;

			this.keyHandler = function(evt) {
				var t = new Point();
				switch (evt.keyCode) {
				case 39:
					t.x = 1;
					break;
				case 37:
					t.x = -1;
					break;
				case 40:
					t.y = 1;
					break;
				case 38:
					t.y = -1;
					break;
				case 46:
					if (self.ondelete)
						self.ondelete();
					self.hide();
					return;
				default:
					return;
				}

				if (!evt.shiftKey) {
					t.x *= 10;
					t.y *= 10;
				}

				self.elem.translate(t.x, t.y);
				self.pos.x += t.x;
				self.pos.y += t.y;
				self.painter.draw();
				self.update(self.painter.offset);
			};

			this.onduplicate = function() {
				console.log("fuck");
				var newElem = clone(self.elem);
				newElem.translate(30, 10);
				self.painter.elements.push(newElem);
				self.painter.draw();
			};

			function menuEntry(key, name) {
				var li = document.createElement("li");
				li.innerHTML = name;
				li.style.cssText =
					"cursor: pointer";
				li.onclick = function() {
					if (self["on"+key])
						self["on"+key]();

					self.hide();
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
			this.menuElem.appendChild(menuEntry("sendtoback", "Send To Back"));
			this.menuElem.appendChild(menuEntry("sendtofront", "Send To Front"));
			this.menuElem.appendChild(menuEntry("duplicate", "Duplicate"));
			this.menuElem.style.cssText =
				"box-sizing: border-box;"+
				"display: inline-block;"+
				"background: white;"+
				"border: 1px solid black;"+
				"border-radius: 20px;"+
				"padding: 10px;"+
				"list-style-type: none";

			this.containerElem = document.createElement("div");
			this.containerElem.style.cssText =
				"-moz-transition: top 0s linear, left 0s linear;"+
				"-webkit-transition: top 0s linear, left 0s linear;"+
				"-ms-transition: top 0s linear, left 0s linear;"+
				"-o-transition: top 0s linear, left 0s linear;"+
				"transition: top 0s linear, left 0s linear;"+
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
			this.containerElem.style.left = (this.camera.x + this.pos.x + offset.x - 6) + "px";
			this.containerElem.style.top = (this.camera.y + this.pos.y  + offset.y - 6) + "px";
		};

		Overlay.prototype.show = function(elem, offset) {
			this.visible = true;
			this.elem = elem;
			var rect = elem.getBoundingRect();

			this.pos.x = rect.start.x;
			this.pos.y = rect.start.y;
			this.update(offset);

			this.containerElem.style.display = "block";

			this.boundingElem.style.width = (rect.end.x - rect.start.x + 10) + "px";
			this.boundingElem.style.height = (rect.end.y - rect.start.y + 10) + "px";

			window.removeEventListener("keydown", this.keyHandler);
			window.addEventListener("keydown", this.keyHandler);
		};

		Overlay.prototype.hide = function() {
			this.visible = false;
			this.elem = null;
			this.containerElem.style.display = "none";
			window.removeEventListener("keydown", this.keyHandler);
		};
	//}

	var Shape = {
		isIntersected: function(s, x, y) {
			var rect = s.getBoundingRect();

			if (
				x >= rect.start.x && x <= rect.end.x &&
				y >= rect.start.y && y <= rect.end.y
			) {
				return true;
			}

			return false;
		}
	};

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
			return Shape.isIntersected(this, x, y);
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

		//class Line {
		function Line(x, y) {
			this.type = "Line";
			this.start = new Point(x, y);
			this.end = new Point(x, y);
		}

		Line.prototype.draw = function(ctx) {
			this.start.draw(ctx);
			this.end.draw(ctx);
			ctx.beginPath();
			ctx.moveTo(this.start.x, this.start.y);
			ctx.lineTo(this.end.x, this.end.y);
			ctx.stroke();
		};

		Line.prototype.isIntersected = function(x, y) {
			return Shape.isIntersected(this, x, y);
		};

		Line.prototype.getBoundingRect = function() {
			var lwidth = parseInt(this.styles.lineWidth) / 2 || 0;

			var tmp;
			var start = new Point(this.start.x, this.start.y);
			var end = new Point(this.end.x, this.end.y);

			if (this.end.x < this.start.x) {
				tmp = start.x;
				start.x = end.x;
				end.x = tmp;
			}

			if (this.end.y < this.start.y) {
				tmp = start.y;
				start.y = end.y;
				end.y = tmp;
			}

			return {
				start: new Point(start.x - lwidth, start.y - lwidth),
				end: new Point(end.x + lwidth, end.y + lwidth)
			};
		};

		Line.prototype.translate = function(x, y) {
			this.start.x += x;
			this.start.y += y;
			this.end.x += x;
			this.end.y += y;
		};
		//}

		//class Rectangle {
		function Rectangle(x, y) {
			this.type = "Rectangle";
			this.start = new Point(x, y);
			this.end = new Point(x, y);
		}

		Rectangle.prototype.done = function() {
			var tmp;

			if (this.end.x < this.start.x) {
				tmp = this.start.x;
				this.start.x = this.end.x;
				this.end.x = tmp;
			}

			if (this.end.y < this.start.y) {
				tmp = this.start.y;
				this.start.y = this.end.y;
				this.end.y = tmp;
			}
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
			return Shape.isIntersected(this, x, y);
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
			return Shape.isIntersected(this, x, y);
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
			this.deleted = [];
			this.offset = new Point(canvas.offsetLeft, canvas.offsetTop);
			this.inTouchLine = false;
			this.camera = new Point(0, 0);
			this.overlay = new Overlay(this);
			this.overlay.camera = this.camera;

			window.addEventListener("resize", function() {
				this.offset.x = canvas.offsetLeft;
				this.offset.y = canvas.offsetTop;
				this.draw();
			}.bind(this));

			canvas.addEventListener("mousedown", function(evt) {
				if (this.mode === "freehand")
					this.startMouse("paintFreehand", evt);
				else if (this.mode === "line")
					this.startMouse("paintLine", evt);
				else if (this.mode === "rectangle")
					this.startMouse("paintRectangle", evt);
				else if (this.mode === "circle")
					this.startMouse("paintCircle", evt);
				else if (this.mode === "select")
					this.startMouse("paintSelect", evt);
				else
					alert("nuu");
			}.bind(this));

			canvas.addEventListener("touchstart", function(evt) {
				if (this.mode === "freehand")
					this.startTouch("paintFreehand", evt);
				else if (this.mode === "line")
					this.startTouch("paintLine", evt);
				else if (this.mode === "rectangle")
					this.startTouch("paintRectangle", evt);
				else if (this.mode === "circle")
					this.startTouch("paintCircle", evt);
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
			elem.addPoint(new Point(obj.x, obj.y), self.ctx);

			var prev = new Point(obj.x, obj.y);
			var prevTime = new Date().getTime();

			obj.elem = elem;

			obj.onmove = function(x, y) {
				if (
					(diff(x, prev.x) > 5) ||
					(diff(y, prev.y) > 5) ||
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
		Painter.prototype.paintLine = function(obj) {
			var self = this;
			var elem = new Line(obj.x, obj.y);
			this.elements.push(elem);

			obj.elem = elem;

			obj.onmove = function(x, y) {
				elem.end.x = x;
				elem.end.y = y;
				self.draw();
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
				elem.end.x = x;
				elem.end.y = y;
				self.draw();
			};

			obj.onend = function() {
				elem.done();
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
		Painter.prototype.paintSelect = function(obj, raw) {
			var self = this;
			var old = raw;
			var isMoving = false;

			//If the touched element is already selected, we move it around
			if (self.overlay.elem && self.overlay.elem.isIntersected(obj.x, obj.y)) {

				//Move by draggingn
				obj.onmove = function(x, y, raw) {
					self.overlay.elem.translate(raw.x - old.x, raw.y - old.y);
					self.overlay.show(self.overlay.elem, self.offset);
					self.draw();

					old = raw;
				};
				return;
			}

			//We know we're not touching an already selected element,
			//so we hide the overlay, just in case
			self.overlay.hide();

			//A possible touched element isn't already selected,
			//so we try to select it
			var elem;
			for (var i = self.elements.length - 1; i >= 0; --i) {
				if (self.elements[i].isIntersected(obj.x, obj.y)) {
					elem = self.elements[i];
					break;
				}
			}

			//If we move the touch point before releasing, we move the camera
			//instead of seleccting an element
			obj.onmove = function(x, y, raw) {
				if (!isMoving && diff(old.x, raw.x) < 10 && diff(old.y, raw.y) < 10)
					return;

				self.translateCamera(raw.x - old.x, raw.y - old.y);
				self.overlay.update(self.offset);

				old = raw;
				isMoving = true;
			};

			//If we're touching an element, show element
			obj.onend = function(x, y) {

				//If we have moved the camera, we don't want to select anything
				if (isMoving || !elem)
					return;

				self.overlay.show(elem, self.offset);

				self.overlay.ondelete = function() {
					var i = self.elements.indexOf(elem);
					self.deleted.push(elem);
					self.elements.splice(i, 1);
					self.draw();
				};

				self.overlay.onsendtoback = function() {
					var i = self.elements.indexOf(elem);
					self.elements.splice(i, 1);
					self.elements.splice(0, 0, elem);
					self.draw();
				};

				self.overlay.onsendtofront = function() {
					var i = self.elements.indexOf(elem);
					self.elements.splice(i, 1);
					self.elements.push(elem);
					self.draw();
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
		Painter.prototype.undelete = function() {
			if (this.deleted.length === 0)
				return;

			this.elements.push(this.deleted.pop());
			this.draw();
		};
		Painter.prototype.clear = function() {
			this.overlay.hide();
			this.draw();
			this.ctx.translate(-this.camera.x, -this.camera.y);
			this.camera.x = 0;
			this.camera.y = 0;
			this.trash = [];
			this.elements = [];
			this.draw();
		};
		Painter.prototype.getDataURL = function() {
			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext("2d");

			var start = new Point();
			var end = new Point();

			this.elements.forEach(function(elem, i) {
				var rect = elem.getBoundingRect();

				if (i === 0) {
					start.x = rect.start.x;
					start.y = rect.start.y;
					end.x = rect.end.x;
					end.y = rect.end.y;
					return;
				}

				if (start.x > rect.start.x)
					start.x = rect.start.x;
				if (start.y > rect.start.y)
					start.y = rect.start.y;
				if (end.x < rect.end.x)
					end.x = rect.end.x;
				if (end.y < rect.end.y)
					end.y = rect.end.y;
			});

			canvas.width = (end.x - start.x) + 20;
			canvas.height = (end.y - start.y) + 20;
			ctx.translate(-start.x + 10, -start.y + 10);

			this.draw();
			this.draw(ctx);

			return canvas.toDataURL();
		};

		Painter.prototype.draw = function(ctx) {
			ctx = ctx || this.ctx;

			ctx.clearRect(
				-this.camera.x,
				-this.camera.y,
				this.canvas.width,
				this.canvas.height
			);

			this.elements.forEach(function(elem) {
				ctx.save();

				this.setStyles(elem, ctx);
				elem.draw(ctx);

				ctx.restore();
			}.bind(this));
		};

		Painter.prototype.setStyles = function(obj, ctx) {
			ctx = ctx || this.ctx;

			if (obj.styles === undefined) {
				obj.styles = {};
				for (var i in this.styles) {
					obj.styles[i] = this.styles[i];
				}
			}

			ctx.lineWidth = obj.styles.lineWidth || undefined;
			ctx.strokeStyle = obj.styles.strokeStyle || undefined;
			if (obj.styles.lineWidth === "0")
				ctx.strokeStyle = "rgba(0, 0, 0, 0)";
			ctx.fillStyle = obj.styles.fillStyle || undefined;
		};
	//}
})();
