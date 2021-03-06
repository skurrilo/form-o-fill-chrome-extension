/*global jQuery, Libs */
var rules = [
{
  url: /.*test.*/,
  name: "Testcase for all <form> field types",
  before: function(resolve) {
    jQuery.getJSON("http://www.openthesaurus.de/synonyme/search?q=test&format=application/json").done(function(data) {
      resolve(data);
    });
  },
  fields: [
  {
    selector: "input[type=text]",
    value: function(e, $data) {
      var item = Math.round(Math.random() * ($data.synsets.length - 1));
      return $data.synsets[item].terms[0].term;
    }
  },
  {
    selector: "input[type=button]",
    value: "123"
  },
  {
    selector: "input[type=checkbox]",
    value: "checkbox"
  },
  {
    selector: "input[type=image]",
    value: "123"
  },
  {
    selector: "input[type=password]",
    value: "123"
  },
  {
    selector: "input[type=radio]",
    value: "radio"
  },
  {
    selector: "textarea",
    value: "123"
  },
  {
    selector: "select.single",
    value: "option2"
  },
  {
    selector: "select[multiple]",
    value: ["multiple1", "multiple2"]
  },
  {
    selector: "input[type=search]",
    value: "123"
  },
  {
    selector: "input[type=email]",
    value: "someone@example.com"
  },
  {
    selector: "input[type=url]",
    value: "123"
  },
  {
    selector: "input[type=tel]",
    value: "123"
  },
  {
    selector: "input[type=number]",
    value: "123"
  },
  {
    selector: "input[type=range]",
    value: "123"
  },
  {
    selector: "input[type=date]",
    value: function() {
      return Libs.moment().format("YYYY-MM-DD");
    }
  },
  {
    selector: "input[type=month]",
    value: "2014-06"
  },
  {
    selector: "input[type=week]",
    value: "2014-W42"
  },
  {
    selector: "input[type=time]",
    value: "12:01:02.123"
  },
  {
    selector: "input[type=datetime]",
    value: "1996-12-19T16:39:57-08:00"
  },
  {
    selector: "input[type=datetime-local]",
    value: "1996-12-19T16:39:57.123"
  },
  {
    selector: "input[type=color]",
    value: "#FF0000"
  }]
},
{
  url: ".*?192.*?/test.*",
  name: "Testform Config 2 with a very very long name and thats totally cool with me",
  fields: [
  {
    selector: "input[type=text]",
    value: "123"
  }]
}
];
