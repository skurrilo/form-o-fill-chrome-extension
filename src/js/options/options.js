/*global $, JSONEditor, ace, RuleStorage, Utils, Rules*/
/*eslint max-nested-callbacks: 0*/
$(function() {
  var noticesVisible = false;

  // Menu functionality for chrome-bootstrap
  $('.menu').on("click", "a", function(ev) {
    ev.preventDefault();
    $('.mainview > *').removeClass("selected");
    $('.menu li').removeClass("selected");
    $('.mainview > *:not(.selected)').css('display', 'none');

    $(ev.currentTarget).parent().addClass("selected");
    var currentView = $($(ev.currentTarget).attr('href'));
    currentView.css('display', 'block');
    currentView.addClass("selected");
    $('body')[0].scrollTop = 0;
  });

  $('.mainview > *:not(.selected)').css('display', 'none');

  var editorNode = document.querySelector("#ruleeditor-ace");

  // Load Ace
  var editor = ace.edit(editorNode);
  var editorSession = editor.getSession();

  editor.setTheme("ace/theme/jsoneditor");

  editorSession.setMode("ace/mode/javascript");
  editorSession.setTabSize(2);
  editorSession.setUseSoftTabs(true);

  // reset notices once the user starts typing again
  editorSession.on("change", function(){
    if(noticesVisible) {
      $("#ruleeditor .notice").hide();
      noticesVisible = false;
    }
  });

  // Fill with data from storage
  RuleStorage.loadRules().then(function (ruleString) {
    editor.setValue(ruleString, -1);
  });

  var $menuInfo = $(".editor .menu .info");

  // A function to disply a nice message in the rule editor
  var infoMsg = function(msg) {
    $menuInfo.html(msg).css({"opacity": "1"});
    setTimeout(function() {
      $menuInfo.animate({"opacity": 0}, 1000, function() {
        $(this).html("");
      });
    }, 1000);
  };

  // Cleans up the rules code
  // eg. remove trailing newlines
  var cleanupRulesCode = function() {
    var editorDocument = editorSession.getDocument();
    var lastLineIndex = editorDocument.getLength() - 1;
    var line = null;
    for(var i = lastLineIndex; i > 0; i--) {
      line = editorDocument.getLine(i).trim();
      if(line === "") {
        editorDocument.removeLines(i,i);
      } else {
        break;
      }
    }
    return true;
  };

  // Simple checks for the neccessary structure of the rules
  // and displays a nice notice
  var syntaxCheckRulesOk = function() {
    var errors = [];

    // Check if there are some ACE Annotations (aka. errors) present
    var annotationCount =  editorSession.getAnnotations().length;
    if(annotationCount > 0) {
      errors.push("annotations-present");
    }

    // Check structure of rules code
    if(!/^(var\s+)?([a-z_])+\s+=\s+\[\s?$/i.test(editorSession.getLine(0)) ||
       !/^\s*\];\s*$/.test(editorSession.getLine(editorSession.getLength() - 1))) {
      errors.push("var-needed");
    }

    if(errors.length > 0) {
      errors.forEach(function (errorClass) {
        $("#ruleeditor .notice." + errorClass).show();
      });
      infoMsg("Rules invalid, not saved");
      noticesVisible = true;
      return false;
    }
    return true;
  };

  // Save the rules
  var saveRules = function() {
    if(cleanupRulesCode() && syntaxCheckRulesOk()) {
      $("#ruleeditor .notice").hide();
      RuleStorage.saveRules(editor.getValue()).then(function () {
        infoMsg("Rules saved");
      });
    }
  };

  // Button handling for "save" and "load"
  $(".editor .menu").on("click", "button.save", function () {
    saveRules();
  }).on("click", "button.reload", function () {
    RuleStorage.loadRules().then(function (ruleJson) {
      editor.setValue(ruleJson, -1);
      infoMsg("Rules loaded from disc");
    });
  });

  // Try to fix the erronous structure of the rules
  $("a.cmd-fix-var-needed").on("click", function() {
    if(noticesVisible) {
      var editorDocument = editorSession.getDocument();

      // Fix the first line not correctly containing "var rules = ["
      var lineStart = editorDocument.getLine(0);
      var lineCount = editorDocument.getLength();
      var lineEnd = editorDocument.getLine(lineCount - 1);

      if(lineStart.indexOf("{") > -1) {
        // Assume "var rules = [" is missing
        editorDocument.insertLines(0, [ "var rules = [" ]);
      } else {
        var AceRange = ace.require('ace/range').Range;
        editorDocument.replace(new AceRange(0,0,0,999), "var rules = [");
      }

      // Fix the last line not containing "];"
      if(!/^\s*\];\s*$/.test(lineEnd)) {
        editorDocument.insertLines(lineCount, [ "];" ]);
      }
    }
  });
});