/*global jQuery*/
jQuery("#new-rule-local").on("change", function(e) {
  e.preventDefault();
  var ruleFiles = e.target.files;
  var reader = new FileReader();

  for (var i = 0; i < ruleFiles.length; i++) {
    var file = ruleFiles[i];
    console.log(file.name);
    console.log(file.type);
    console.log(file.size);
    reader.onload = (function (theFile) {
      return function(e) {
        console.log(e.target.result);
      };
    })(file);
    var result = reader.readAsText(file);
    console.log(result);
  }
});
