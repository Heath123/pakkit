/*
 * JSON Tree Viewer
 * http://github.com/summerstyle/jsonTreeViewer
 *
 * Copyright 2017 Vera Lobacheva (http://iamvera.com)
 * Released under the MIT license (LICENSE.txt)
 */

'use strict';

var jsonTreeViewer = (function() {
    var treeWrapper = document.getElementById("tree");
    var tree = jsonTree.create({}, treeWrapper);
    
    return {
        parse : function(json_str) {
            var temp;

            try {
                temp = JSON.parse(json_str);
            } catch(e) {
                alert(e);
            }

            tree.loadData(temp);
        }
    };
})();
