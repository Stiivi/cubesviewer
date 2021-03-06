/*
 * CubesViewer
 * Copyright (c) 2012-2013 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Adds cubesviewer support for binding model to objects. This built model
 * is used along the application. 
 */
cubesviewer.buildModel = function(model) {
	
	$.extend(model, cubesModel.prototype);
	model.buildModel();
	return model;
	
};

cubesBase = function() {};
$.extend (cubesBase.prototype, {

	getName: function() {
		return this.name;
	},
	
	getLabel: function() {
		return this.label;
	},
	
	getInfo: function(key) {
		var result = null;
		if ("info" in this) {
			if (key in this.info) {
				result = this.info[key];
			}
		}
		return result;
	}
	
});

cubesModel = function() {};
$.extend (cubesModel.prototype, cubesBase.prototype);
$.extend (cubesModel.prototype, {
	
	buildModel: function() {
		$(this.dimensions).each(function(idx, dimension) {
			$.extend(dimension, cubesDimension.prototype);
			dimension.buildModel();
		});
		$(this.cubes).each(function(idx, cube) {
			$.extend(cube, cubesCube.prototype);
			cube.buildModel();
		});
	},
	
	/*
	 * Return a cube by name.
	 */
	getCube: function(cubename) {
		var cube = $.grep(this.cubes, function(e) {
			return e.name == cubename;
		})[0];
		
		return cube;
	},
	
	/*
	 * Get a dimension by name.
	 * Accepts dimension level in the input string.
	 */ 
	getDimension: function(dimension) {
		var dimname = dimension;
		if (dimension.indexOf('@') > 0) {
			dimname = dimension.split("@")[0];
		} else if (dimension.indexOf(':') > 0) {
			dimname = dimension.split(":")[0];
		}
		var dim = $.grep(this.dimensions, function(ed) {
			return ed.name == dimname;
		})[0];
		
		return dim;
	},	

	/*
	 * Find level by name. Accept it prefixed with the dimension name:.
	 */
	getDimensionParts: function(dimensionString) {
		
		var dim = this.getDimension(dimensionString);
		
		var lev = null;
		if (dimensionString.indexOf(":") > 0) {
			var levelname = dimensionString.split(":")[1];
			lev = dim.getLevel(levelname);
		}

		var hie = dim.hierarchies[0];
		if (dimensionString.indexOf("@") > 0) {
			var hierarchyName = dimensionString.split("@")[1].split(":")[0];
			hie = dim.getHierarchy(hierarchyName);
		}
		
		return {
			dimension: dim,
			level: lev,
			hierarchy: hie,
			label: dim.label + ( hie.name != "default" ? (" / " + hie.label) : "" ) + ( lev != null ? (": " + lev.label) : "" )
		};
		
	},		
	
	
});
	

cubesDimension = function() {};
$.extend (cubesDimension.prototype, cubesBase.prototype);
$.extend (cubesDimension.prototype, {
	
	buildModel: function() {
		var dim = this;
		$(this.levels).each(function(idx, level) {
			$.extend(level, cubesLevel.prototype);
			level.dimension = dim;
			level.buildModel();
		});
		$(this.hierarchies).each(function(idx, hierarchy) {
			$.extend(hierarchy, cubesHierarchy.prototype);
			hierarchy.dimension = dim;
			hierarchy.buildModel();
		});
	},
	
	/*
	 * Inform if a dimension is a date dimension and can be used as a date
	 * filter (i.e. with range selection tool).
	 */ 
	isDateDimension: function(dimension) {
		return (this.getInfo("cv-datefilter") == true);
	},
	
	/*
	 * Get a level by name.
	 */ 
	getLevel: function(level) {
		var lev = $.grep(this.levels, function(ed) {
			return ed.name == level;
		})[0];
		
		return lev;
	},	

	/*
	 * Get a hierarchy by name.
	 */ 
	getHierarchy: function(hierarchy) {
		var hie = $.grep(this.hierarchies, function(ed) {
			return ed.name == hierarchy;
		})[0];
		
		return hie;
	},		
	
});
	
cubesLevel = function() {};
$.extend (cubesLevel.prototype, cubesBase.prototype);
$.extend (cubesLevel.prototype, {
	
	buildModel: function() {
	},

	/*
	 * Get a attribute by name.
	 * Accepts dimension level in the input string.
	 */ 
	getAttribute: function(attribute) {
		var attr = $.grep(this.attributes, function(el) {
			return el.name == attribute;
		})[0];
		
		return attr;
	},	
	
	/*
	 * Processes a cell and returns an object with a stable information:
	 * o.key
	 * o.label
	 * o.info[]
	 */
	readCell: function(cell) {

		if (!(this.getAttribute(this.key).full_name in cell)) return null;
		
		var result = {};
		result.key = cell[this.getAttribute(this.key).full_name];
		result.label = cell[this.getAttribute(this.label_attribute).full_name];
		result.info = {};
		$(this.attributes).each(function(idx, attribute) {
			result.info[attribute.name] = cell[attribute.full_name];
		});		
		return result;
	},
	
});

cubesHierarchy = function() {};
$.extend (cubesHierarchy.prototype, cubesLevel.prototype);
$.extend (cubesHierarchy.prototype, {
	
	buildModel: function() {
	},
	
	/*
	 * Processes a cell and returns an array of objects with info and label.
	 */
	readCell: function(cell) {
		var result = [];
		var hie = this;
		$(this.levels).each(function(idx, levname) {
			var level = hie.dimension.getLevel(levname);
			info = level.readCell(cell);
			if (info != null) result.push(info);
		});		
		return result;
	},		

});

cubesCube = function() {};
$.extend (cubesCube.prototype, cubesLevel.prototype);
$.extend (cubesCube.prototype, {
	
	buildModel: function() {
	},
	
});
