/* globals describe, it */
'use strict';

var t = require('tcomb');
var assert = require('assert');
var eq = assert.deepEqual;

var payload = {
    "categories": [
        {
            "id": 1,
            "title": "Category #1 with no parent",
            "parentId": 0,
            "children": [{
                "id": 2,
                "title": "Category #2 with parent #1",
                "parentId": 1,
                "children": [
                    {
                        "id": 3,
                        "parentId": 2,
                        "children": [],
                        "title": "Category #3 with parent #2",
                    },
                    {
                        "id": 4,
                        "parentId": 2,
                        "children": [],
                        "title": "Category #3 with parent #2",
                    },
                    {
                        "id": 5,
                        "parentId": 2,
                        "children": [],
                        "title": "Category #3 with parent #2",
                    }
                ]
            }]
        }
    ]
};

var Category = t.struct({
    id: t.Num,
    title: t.Str,
    parentId: t.Num,
    children: t.struct(this)
});


it('complex nested structures', function () {

    var iterate = function(categories) {
        categories.forEach(function(category) {
            console.log(category.title);
            eq(category instanceof Category, true);
            if (category.children) {
                iterate(category.children);
            }
        });
    };

    iterate(payload.categories);
});