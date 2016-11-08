//require('tree', ['dndTree'], function(oDndTree) {
var tree = function(options) {
	if (options) {
		this.renderContainer = options.renderContainer;
		this.renderOrientation = options.renderOrientation || "vertical";
		// Calculate total nodes, max label length
		this.totalNodes = 0;
		this.maxLabelLength = 0;
		// variables for drag/drop
		this.oSelectedNode = null;
		this.oDraggingNode = null;
		// panning variables
		this.panFactor = {
			panSpeed: 200,
			panBoundary: 20 // Within 20px from edges will pan when dragging.
		};
		this.treeViewer = {
			height: options.treeHeight || 500,
			width: options.width || 500
		};


		this.duration = 750;

	}
};

tree.prototype.setData = function setData(oData) {
	this.data = oData;
};

tree.prototype.render = function() {

	this.tree = d3.layout.tree()
		.size([this.treeViewer.height, this.treeViewer.width]);
	this.diagonal = d3.svg.diagonal()
		.projection(function(d) {
			return [d.x, d.y];
		});
	this.zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", jQuery.proxy(this.navigationOperation.zoom, this));
	this.baseSvg = d3.select("#tree-container").append("svg")
		.attr("width", this.treeViewer.width)
		.attr("height", this.treeViewer.height)
		.attr("class", "overlay")
		.call(this.zoomListener);
	this.baseSvg.append("image")
		.attr('xlink:href', 'png/images.jpg')
		.attr("width", this.treeViewer.width)
		.attr("height", this.treeViewer.height)
		.attr("x", 0)
		.attr("y", 0);

	var fnVisit = jQuery.proxy(function(d) {
		this.totalNodes++;
		this.maxLabelLength = Math.max(d.name.length, this.maxLabelLength);
	}, this);
	var fnChildrenExist = function(d) {
		return d.children && d.children.length > 0 ? d.children : null;
	};
	// Call visit function to establish maxLabelLength
	this.visit(this.data, fnVisit, fnChildrenExist);
	this.svgGroup = this.baseSvg.append("g")
		.attr("transform", "translate( 0,0)");
	// Define the root
	this.root = this.data;
	this.root.x0 = this.treeViewer.width / 2;
	this.root.y0 = 70;
	var fnDragEnd = function(d) {
		if (d == this.root) {
			return;
		}
		domNode = this;
		if (this.oSelectedNode && this.oDraggingNode) {
			// now remove the element from the parent, and insert it into the new elements children
			var iIndex = this.oDraggingNode.parent.children.indexOf(this.oDraggingNode);
			if (iIndex > -1) {
				this.oDraggingNode.parent.children.splice(iIndex, 1);
			}
			if (typeof this.oSelectedNode.children !== 'undefined' || typeof this.oSelectedNode._children !== 'undefined') {
				if (typeof this.oSelectedNode.children !== 'undefined') {
					this.oSelectedNode.children.push(this.oDraggingNode);
				} else {
					this.oSelectedNode._children.push(this.oDraggingNode);
				}
			} else {
				this.oSelectedNode.children = [];
				this.oSelectedNode.children.push(this.oDraggingNode);
			}
			// Make sure that the node being added to is expanded so user can see added node is correctly moved
			this.expandOperation.expand.call(this, this.oSelectedNode);
			this.sortTree, call(this);
			this.dragOperation.endDrag.call(this);
		} else {
			this.dragOperation.endDrag.call(this);
		}
	};

	this.dragListener = d3.behavior.drag()
		.on("dragstart", jQuery.proxy(function(d) {
			if (d && d == this.root) {
				return;
			}
			this.dragStarted = true;
			this.nodes = this.tree.nodes(d);
			this.domNode = event.currentTarget;
			d3.event.sourceEvent.stopPropagation();
			// it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
		}, this))
		.on("drag", jQuery.proxy(function(d) {
			if (d && d == this.root) {
				return;
			}
			if (this.dragStarted) {
				domNode = this.domNode;
				this.dragOperation.initiateDrag.call(this, d, domNode);
			}
			// get coords of mouseEvent relative to svg container to allow for panning
			relCoords = d3.mouse($('svg').get(0));
			if (relCoords[0] < this.panFactor.panBoundary) {
				this.panTimer = true;
				this.navigationOperation.pan.call(this, domNode, 'left');
			} else if (relCoords[0] > ($('svg').width() - this.panFactor.panBoundary)) {

				this.panTimer = true;
				this.navigationOperation.pan.call(this, domNode, 'right');
			} else if (relCoords[1] < this.panFactor.panBoundary) {
				this.panTimer = true;
				this.navigationOperation.pan.call(this, domNode, 'up');
			} else if (relCoords[1] > ($('svg').height() - this.panFactor.panBoundary)) {
				this.panTimer = true;
				this.navigationOperation.pan.call(this, domNode, 'down');
			} else {
				try {
					clearTimeout(this.panTimer);
				} catch (e) {

				}
			}

			d.x0 += d3.event.dx;
			d.y0 += d3.event.dy;
			var node = d3.select(domNode);
			node.attr("transform", "translate(" + d.x0 + "," + d.y0 + ")");
			this.updateTempConnector.call(this);
		}, this)).on("dragend", jQuery.proxy(function(d) {
			if (d == this.root) {
				return;
			}
			domNode = this.domNode;
			if (this.oSelectedNode && this.oDraggingNode) {
				// now remove the element from the parent, and insert it into the new elements children
				var iIndex = this.oDraggingNode.parent.children.indexOf(this.oDraggingNode);
				if (iIndex > -1) {
					this.oDraggingNode.parent.children.splice(iIndex, 1);
				}
				if (typeof this.oSelectedNode.children !== 'undefined' || typeof this.oSelectedNode._children !== 'undefined') {
					if (typeof this.oSelectedNode.children !== 'undefined') {
						this.oSelectedNode.children.push(this.oDraggingNode);
					} else {
						this.oSelectedNode._children.push(this.oDraggingNode);
					}
				} else {
					this.oSelectedNode.children = [];
					this.oSelectedNode.children.push(this.oDraggingNode);
				}
				// Make sure that the node being added to is expanded so user can see added node is correctly moved
				this.expandOperation.expand.call(this, this.oSelectedNode);
				this.sortTree.call(this);
				this.dragOperation.endDrag.call(this);
			} else {
				this.dragOperation.endDrag.call(this);
			}
		}, this));
	// Layout the tree initially and center on the root node.
	this.update(this.root);
	//this.centerNode(this.root);
};

tree.prototype.visit = function(parent, visitFn, childrenFn) {
	if (!parent) return;
	visitFn(parent);

	var children = childrenFn(parent);
	if (children) {
		var count = children.length;
		for (var i = 0; i < count; i++) {
			this.visit(children[i], visitFn, childrenFn);
		}
	}
};

// sort the tree according to the node names
tree.prototype.sortTree = function sortTree() {
	this.tree.sort(function(a, b) {
		return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
	});
};

tree.prototype.navigationOperation = {
	pan: function pan(domNode, direction) {
		var speed = this.panFactor.panSpeed;
		if (this.panTimer) {
			clearTimeout(this.panTimer);
			translateCoords = d3.transform(this.svgGroup.attr("transform"));
			if (direction == 'left' || direction == 'right') {
				translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
				translateY = translateCoords.translate[1];
			} else if (direction == 'up' || direction == 'down') {
				translateX = translateCoords.translate[0];
				translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
			}
			scaleX = translateCoords.scale[0];
			scaleY = translateCoords.scale[1];
			scale = this.zoomListener.scale();
			this.svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
			d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
			this.zoomListener.scale(this.zoomListener.scale());
			this.zoomListener.translate([translateX, translateY]);
			this.panTimer = setTimeout(jQuery.proxy(function() {
				this.navigationOperation.pan.call(this, domNode, speed, direction);
			}, this), 50);
		}
	},
	zoom: function zoom() {
		this.svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}
};

tree.prototype.dragOperation = {
	initiateDrag: function initiateDrag(d, domNode) {
		this.oDraggingNode = d;
		d3.select(domNode).append('circle')
		.attr('r', 40)
		.attr('fill','grey')
		.attr('class', 'dragNodeSelector')
		.attr("opacity", 0.2);

		d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
		//d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
		d3.select(domNode).attr('class', 'node activeDrag');

		this.svgGroup.selectAll("g.node").sort(jQuery.proxy(function(a, b) { // select the parent and sort the path's
			if (a.id != this.oDraggingNode.id) return 1; // a is not the hovered element, send "a" to the back
			else return -1; // a is the hovered element, bring "a" to the front
		}, this));
		// if nodes has children, remove the links and nodes
		if (this.nodes.length > 1) {
			// remove link paths
			links = tree.links(this.nodes);
			nodePaths = this.svgGroup.selectAll("path.link")
				.data(links, function(d) {
					return d.target.id;
				}).remove();
			// remove child nodes
			nodesExit = this.svgGroup.selectAll("g.node")
				.data(this.nodes, function(d) {
					return d.id;
				}).filter(jQuery.proxy(function(d, i) {
					if (d.id == this.oDraggingNode.id) {
						return false;
					}
					return true;
				}, this)).remove();
		}
		// remove parent link
		parentLink = tree.links(tree.nodes(this.oDraggingNode.parent));
		this.svgGroup.selectAll('path.link').filter(jQuery.proxy(function(d, i) {
			if (d.target.id == this.oDraggingNode.id) {
				return true;
			}
			return false;
		}, this)).remove();

		this.dragStarted = null;
	},
	endDrag: function endDrag() {
		this.oSelectedNode = null;
		domNode = this.domNode;
		d3.select(domNode).select('.dragNodeSelector').remove();		
		d3.select(domNode).attr('class', 'node');
		// now restore the mouseover event or we won't be able to drag a 2nd time
		d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
		this.updateTempConnector();
		if (this.oDraggingNode !== null) {
			this.update(this.root);
			//this.centerNode(this.oDraggingNode);
			this.oDraggingNode = null;
		}
	}
};

tree.prototype.expandOperation = {
	collapse: function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	},
	expand: function expand(d) {
		if (d._children) {
			d.children = d._children;
			d.children.forEach(expand);
			d._children = null;
		}
	}
};
tree.prototype.circle = {
	overCircle: function(d) {
		if (d !== this.oDraggingNode) {
			this.oSelectedNode = d;
			this.updateTempConnector();
		}
	},
	outCircle: function(d) {
		if (d !== this.oDraggingNode) {
			this.oSelectedNode = d;
			this.updateTempConnector();
		}
	}
};
// Function to update the temporary connector indicating dragging affiliation
tree.prototype.updateTempConnector = function() {
	var data = [];
	if (this.oDraggingNode && this.oSelectedNode) {
		// have to flip the source coordinates since we did this for the existing connectors on the original tree
		data = [{
			source: {
				x: this.oSelectedNode.x0,
				y: this.oSelectedNode.y0
			},
			target: {
				x: this.oDraggingNode.x0,
				y: this.oDraggingNode.y0
			}
		}];
	}
	var link = this.svgGroup.selectAll(".templink").data(data);
	link.enter().append("path")
		.attr("class", "templink")
		.attr("d", d3.svg.diagonal())
		.attr('pointer-events', 'none');

	link.attr("d", d3.svg.diagonal());
	link.exit().remove();
};
tree.prototype.centerNode = function centerNode(source) {
	scale = this.zoomListener.scale();
	x = -source.y0;
	y = -source.x0;
	x = x * scale + this.treeViewer.width / 2;
	y = y * scale + this.treeViewer.height / 2;
	d3.select('g').transition()
		.duration(this.duration)
		.attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
	this.zoomListener.scale(scale);
	this.zoomListener.translate([x, y]);
};
tree.prototype.toggleChildren = function toggleChildren(d) {
	if (d.children) {
		d._children = d.children;
		d.children = null;
	} else if (d._children) {
		d.children = d._children;
		d._children = null;
	}
	return d;
};
tree.prototype.click = function click(d) {
	if (d3.event.defaultPrevented) return; // click suppressed
	d = this.toggleChildren(d);
	this.update(d);
	//this.centerNode(d);
};

tree.prototype.addNodeElement = function addNodeElement(aNodes) {
	/*aNodes.append("image")
		.attr("xlink:href", function(d) {
			return "png//lettern.png";
		})
		.attr("x", "-10")
		.attr("y", "-10")
		.attr("width", "24px")
		.attr("height", "24px");*/
	aNodes.append("circle")
		.attr('class', 'nodeCircle')
		.attr("r", 10).attr("class", function(d) {
			switch (d.name ? d.name.length % 4 : 0) {
				case 0:
					return 'nodeRed';
				case 1:
					return 'nodeBlue';
				case 2:
					return 'nodeGreen';
				case 3:
					return 'nodeYellow';
			}

		})
		.on("mouseover", jQuery.proxy(function(node) {
			this.circle.overCircle.call(this, node);
		}, this))
		.on("mouseout", jQuery.proxy(function(node) {
			this.circle.outCircle.call(this, node);
		}, this));;

	/*aNodes.append("text")
		.attr("x", function(d) {
			return 0; //d.children || d._children ? -10 : 10;
		})
		.attr("dy", ".35em")
		.attr('class', 'nodeText')
		.attr("text-anchor", function(d) {
			return d.children || d._children ? "end" : "start";
		})
		.text(function(d) {
			return ""; //d.name;
		})
		.style("fill-opacity", 0);*/

	// phantom node to give us mouseover in a radius around it
	aNodes.append("circle")
		.attr('class', 'ghostCircle')
		.attr("r", 30)
		.attr("opacity", 0.2) // change this to zero to hide the target area
		.style("fill", "red")
		.attr('pointer-events', 'mouseover')
		.on("mouseover", jQuery.proxy(function(node) {
			this.circle.overCircle.call(this, node);
		}, this))
		.on("mouseout", jQuery.proxy(function(node) {
			this.circle.outCircle.call(this, node);
		}, this));
}

tree.prototype.update = function update(source) {
	// Compute the new height, function counts total children of root node and sets tree height accordingly.
	// This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
	// This makes the layout more consistent.
	var levelWidth = [1];
	var childCount = function(level, n) {

		if (n.children && n.children.length > 0) {
			if (levelWidth.length <= level + 1) levelWidth.push(0);

			levelWidth[level + 1] += n.children.length;
			n.children.forEach(function(d) {
				childCount(level + 1, d);
			});
		}
	};
	childCount(0, this.root);
	var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line  
	tree = this.tree.size([newHeight, this.treeViewer.width]);

	// Compute the new tree layout.
	var nodes = this.tree.nodes(this.root).reverse(),
		links = this.tree.links(nodes);

	// Set widths between levels based on maxLabelLength.
	nodes.forEach(jQuery.proxy(function(d) {
		//d.y = (d.depth * (this.maxLabelLength * 10)); //maxLabelLength * 10px
		// alternatively to keep a fixed scale one can set a fixed depth per level
		// Normalize for fixed-depth by commenting out below line
		d.y = (d.depth * 100); //500px per level.
	}, this));
	var i = 0;
	// Update the nodes…
	node = this.svgGroup.selectAll("g.node")
		.data(nodes, function(d) {
			return d.id || (d.id = ++i);
		});

	// Enter any new nodes at the parent's previous position.
	var nodeEnter = node.enter().append("g")
		.call(this.dragListener)
		.attr("class", "node")
		.attr("transform", function(d) {
			return "translate(" + d.y + "," + d.x + ")";
		})
		.on('click', jQuery.proxy(this.click, this));



	/*nodeEnter.append("image")
		.attr("xlink:href", function(d) {
			return "png//lettern.png";
		})
		.attr("x", "-12px")
		.attr("y", "-12px")
		.attr("width", "24px")
		.attr("height", "24px");*/

	this.addNodeElement.call(this, nodeEnter);


	// Update the text to reflect whether node has children or not.
	node.select('text')
		.attr("text-anchor", function(d) {
			return d.children || d._children ? "end" : "start";
		})
		.text(function(d) {
			return d.name.length + ""; //d.name;
		});

	// Change the circle fill depending on whether it has children and is collapsed
	node.select("circle.nodeCircle")
		.attr("r", 10)
		.attr("class", function(d) {
			switch (d.name ? d.name.length % 4 : 0) {
				case 0:
					return 'nodeRed';
					break;
				case 1:
					return 'nodeBlue';
					break;
				case 2:
					return 'nodeGreen';
					break;
				case 3:
					return 'nodeYellow';
					break;
			}

		});
	/*.style("fill", function(d) {
		return d._children ? "lightsteelblue" : "#fff";
	});*/

	// Transition nodes to their new position.
	var nodeUpdate = node.transition()
		.duration(this.duration)
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});

	// Fade the text in
	nodeUpdate.select("text")
		.style("fill-opacity", 1);

	// Transition exiting nodes to the parent's new position.
	var nodeExit = node.exit().transition()
		.duration(this.duration)
		.attr("transform", function(d) {
			return "translate(" + source.y + "," + source.x + ")";
		})
		.remove();

	nodeExit.select("circle")
		.attr("r", 0);

	nodeExit.select("text")
		.style("fill-opacity", 0);

	// Update the links…
	var link = this.svgGroup.selectAll("path.link")
		.data(links, function(d) {
			return d.target.id;
		})
		.on('click', function() {
			console.log(this);
		});

	// Enter any new links at the parent's previous position.
	link.enter().insert("path", "g")
		.attr("class", "link")
		.attr("d", jQuery.proxy(function(d) {
			var o = {
				x: source.x0,
				y: source.y0
			};
			return this.diagonal({
				source: o,
				target: o
			});
		}, this));


	// Transition links to their new position.
	link.transition()
		.duration(this.duration)
		.attr("d", this.diagonal);

	// Transition exiting nodes to the parent's new position.
	link.exit().transition()
		.duration(this.duration)
		.attr("d", jQuery.proxy(function(d) {
			var o = {
				x: source.x,
				y: source.y
			};
			return this.diagonal({
				source: o,
				target: o
			});
		}, this))
		.remove();

	// Stash the old positions for transition.
	nodes.forEach(function(d) {
		d.x0 = d.x;
		d.y0 = d.y;
	});
};