/*global $, JSONEditor, ace, Storage, Logger, Utils, Rules, Rule, I18n, ChromeBootstrap, Editor, JSONF */
// This file is a big bag of mixed responsibilities.
// Break this into parts!
//
var editor = new Editor("#ruleeditor-ace");

$(function() {
  var noticesVisible = false;

  I18n.loadPages(["help", "about", "modalimport"]);

  if(Utils.debug) {
    I18n.loadPages(["logs"]);
  }

  ChromeBootstrap.init();

  // reset notices once the user starts typing again
  editor.on("change", function() {
    if(noticesVisible) {
      $("#ruleeditor .notice").hide();
      noticesVisible = false;
    }
  });

  // Current active tab id
  var currentTabId = function() {
    var currentTab = $(".tab.current");
    if(currentTab.length === 1) {
      return currentTab.data("tab-id");
    }
    return 1;
  };

  // Append text to the end of the rule definitions
  var appendRule = function(prettyRule, responseCallback) {
    // Use
    Rules.load().then(function(rulesFunction) {
      var lines = [];
      if(rulesFunction.length > 0) {
        lines.push(",");
      }
      lines = lines.concat(prettyRule.split("\n"));
      editor.document().insertLines(editor.document().getLength() - 1, lines);
      // Prettify code a little
      editor.session().setValue(Rules.format(editor.session().getValue()), -1);
      editor.scrollToRow(editor.document().getLength());
      responseCallback();
      Utils.infoMsg("Rule added on line " + (editor.document().getLength() - 1));
    });
  };

  // Check for freshly extracted rules and show UI
  Storage.load(Utils.keys.extractedRule).then(function (extractedRule) {
    // There are extracted rules
    if (typeof extractedRule !== "undefined") {
      var $notice = $("#ruleeditor .notice.extracted-present");
      $notice.show();
      $("#ruleeditor .cmd-append-extracted").on("click", function () {
        Logger.info("[options.js] Appending extracted rules to the end of the definition");
        appendRule(extractedRule, function() {
          $notice.hide();
          Storage.delete(Utils.keys.extractedRule);
        });
      });
    }
  });

  // Check for rule filling errors
  Storage.load(Utils.keys.errors).then(function (errorsStorage) {
    if(typeof errorsStorage !== "undefined") {
      var rule = errorsStorage.rule;
      var errors = errorsStorage.errors;
      var $notice = $("#ruleeditor .notice.form-fill-errors");
      var tableTrs = [];
      errors.forEach(function (error) {
        Logger.info("[options.js] Got error " + JSONF.stringify(error) + " for rule " + JSONF.stringify(rule));
        tableTrs.push("<tr><td>" + error.selector + "</td><td>" + error.value + "</td><td>" + error.message + "</td></tr>");
      });
      $notice.find("table").append(tableTrs.join("\n"));
      $notice.find(".rule-name").html(rule.nameClean);
      $notice.find(".rule-url").html(rule.urlClean);
      $notice.show();
      Storage.delete(Utils.keys.errors);

      // Activate the tab with the rule
      var match = rule.id.match(/^([0-9]+)/);
      if(match) {
        Logger.info("[options.js] Activating tab #" + match[1]);
        $(".tab[data-tab-id='" + match[1] + "']").trigger("click");
      }
    }
  });

  // Save the rules
  var saveRules = function(tabId) {
    var errors = Rules.syntaxCheck(editor);
    if(errors.length > 0) {
      errors.forEach(function (errorClass) {
        $("#ruleeditor .notice." + errorClass).show();
      });
      Utils.infoMsg("Rules invalid, not saved");
      noticesVisible = true;
    }

    if(editor.cleanUp() && !noticesVisible) {
      $("#ruleeditor .notice").hide();
      Rules.save(editor.getValue(), tabId).then(function () {
        Utils.infoMsg("Rules saved");
      });
    }
  };

  var loadRules = function(tabId) {
    Storage.load(Utils.keys.rules + "-tab-" + tabId).then(function (ruleData) {
      var ruleJson = ruleData.code;
      if(typeof ruleJson === "undefined") {
        ruleJson = "";
      }
      editor.setValue(ruleJson, -1);
      editor.fixRules();
      Utils.infoMsg("Rules loaded from disc");
    });
  };

  // export rules to disk
  var exportRules = function() {
    var promises = [];
    Storage.load(Utils.keys.tabs).then(function(tabSettings) {
      tabSettings.forEach(function (setting) {
        promises.push(Storage.load(Utils.keys.rules + "-tab-" + setting.id));
      });

      Promise.all(promises).then(function(rulesFromAllTabs) {
        var exportJson = {
          "tabSettings": tabSettings,
          "rules": rulesFromAllTabs
        };
        Logger.info("[options.js] Exporting " + JSONF.stringify(exportJson));
        Utils.download(JSONF.stringify(exportJson), "form-o-fill-rules-export.json", "application/json");
      });
    });
  };

  // import rules from disc
  var importRules = function() {
    $("#modalimport").show();
    // Tell use that the rules will replace all current rules
    // Modal dialog
    // import
  };

  // Load data from tab and prefill editor
  loadRules(currentTabId());

  // Button handling for "save" and "load"
  $(".editor .menu").on("click", "button.save", function () {
    saveRules(currentTabId());
  }).on("click", "button.reload", function () {
    loadRules(currentTabId());
  }).on("click", "button.format", function () {
    editor.format(Rules);
    Utils.infoMsg("Rules formatted but not saved");
  }).on("click", "button.export", exportRules)
  .on("click", "button.import", importRules);

  // Try to fix the erronous structure of the rules
  $(document).on("click", "a.cmd-fix-var-needed", function() {
    editor.fixRules();
  });

  // Export all rules (for modal import dialog)
  $(document).on("click", "a.cmd-export-all-rules", function() {
    exportRules();
  });

  // Event handler for notices
  $(".notice.form-fill-errors").on("click", function () {
    Storage.delete(Utils.keys.errors);
    $(this).hide();
  });

  $(".notice.extracted-present").on("click", function () {
    Storage.delete(Utils.keys.extractedRule);
    $(this).hide();
  });

  $(".notice.annotations-present, .notice.var-needed").on("click", function () {
    $(this).hide();
  });
});

