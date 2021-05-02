import { apiInitializer } from "discourse/lib/api";
import { h } from "virtual-dom";
export default apiInitializer("0.8", (api) => {
  const enableConnectorName = settings.plugin_outlet;
  const disableConnectorName =
    enableConnectorName === "below-site-header"
      ? "below-site-header"
      : "above-main-container";

  api.registerConnectorClass(disableConnectorName, "search-banner", {
    shouldRender() {
      return false;
    },
  });

  // Simplified version of header search theme component
  const searchMenuWidget = api.container.factoryFor("widget:search-menu");
  const corePanelContents = searchMenuWidget.class.prototype["panelContents"];
  const keyDownfunction = searchMenuWidget.class.prototype["keyDown"];
  api.reopenWidget("search-menu", {
    buildKey: function (attrs) {
      let type = attrs.formFactor || "menu";
      return `search-${type}`;
    },
    defaultState: function (attrs) {
      $.ajax("https://surveysparrow.trydiscourse.com/categories.json").then(
        (data) => {
          // some data formatting to html
          // console.log("value is",data.category_list.categories)
          data.category_list.categories.map((val) => {
            console.log("value is", val.name, val.slug);
          });
          this.state.cdata = data.category_list.categories;
        }
      );
      return {
        formFactor: attrs.formFactor || "menu",
        showHeaderResults: false,
        cdata: [],
        categoryName: "Category",
      };
    },
    html: function () {
      if (this.state.formFactor === "widget") {
        let result = [];
        result.push(this.panelContents());
        if (this.state.cdata.length > 0) {
          let result = [
            h("div.dropdown", [
              h("div.dropbtn", { name: "toggle" }, this.state.categoryName),
              h(
                "div.dropdown-content#myDropdown",
                this.state.cdata.map((val) =>
                  h(
                    "li",
                    {
                      name: val.slug,
                      value: val.name,
                    },
                    val.name
                  )
                )
              ),
            ]),
          ];
          result.push(this.panelContents());
          return result;
        } else {
          let result = [
            h("div.dropdown", [
              h("div.dropbtn", { name: "toggle" }, this.state.categoryName),
            ]),
          ];
          result.push(this.panelContents());
          return result;
        }
      } else {
        return this.attach("menu-panel", {
          maxWidth: 500,
          contents: () => this.panelContents(),
        });
      }
    },
    clickOutside(attrs) {
      if (!this.vnode.hooks["widget-mouse-down-outside"]) {
        return this.mouseDownOutside();
      }
    },
    keyDown: function (attrs) {
      let flg = 0;
      let categoryName = this.state.categoryName;
      setTimeout(function () {
        if ($("#search-term").val() === "") {
          categoryName = "Category";
        }
      }, 1);
    },
    mouseDown(attrs) {
      if (attrs.target.name === "search") {
        this.showResults();
      }
      console.log("click called", attrs);
      console.log("testing changestyu", keyDownfunction);
    },
    mouseDownOutside() {
      const formFactor = this.state.formFactor;
      if (formFactor === "menu") {
        return this.sendWidgetAction("toggleSearchMenu");
      } else {
        this.state.showHeaderResults = false;
        this.scheduleRerender();
      }
    },
    click: function (attrs) {
      document.getElementById("myDropdown").classList.remove("show");
      const formFactor = this.state.formFactor;
      console.log("from on click", this.get("searchData"));
      console.log("search data", this.searchData);
      if (attrs.target.name === "toggle") {
        document.getElementById("myDropdown").classList.toggle("show");
        console.log("handle toggle");
      }
      if (
        this.state.cdata.length > 0 &&
        attrs.target.name !== "" &&
        attrs.target.name !== "toggle" &&
        attrs.target.name !== undefined
      ) {
        this.searchData.term = `#${attrs.target.name}`;
        this.state.categoryName = `#${attrs.target.name}`;
        this.triggerSearch();
        $("#search-term").val(`#${attrs.target.name}`);
        document.getElementById("myDropdown").classList.remove("show");
        this.state.showHeaderResults = false;
        this.scheduleRerender();
      }
      // if (formFactor === "widget") {
      //   this.showResults();
      // }
    },
    focusIn: function () {
      this.showResults();
      console.log("focus is made cap");
    },
    focusin: function () {
      this.showResults();
      console.log("focus is made");
    },
    change: function () {
      document.getElementById("myDropdown").classList.remove("show");
      const formFactor = this.state.formFactor;
      // if (formFactor === "widget") {
      //   this.showResults();
      // }
    },
    showResults: function () {
      this.state.showHeaderResults = true;
      this.scheduleRerender();
    },
    linkClickedEvent: function (attrs) {
      console.log("values are", attrs);
      const formFactor = this.state.formFactor;
      if (formFactor === "widget") {
        $("#search-term").val("");
        $(".search-placeholder").css("visibility", "visible");
        this.state.showHeaderResults = false;
        this.scheduleRerender();
      }
    },
    panelContents: function () {
      const formFactor = this.state.formFactor;
      let showHeaderResults =
        this.state.showHeaderResults == null ||
        this.state.showHeaderResults === true;
      let contents = [];

      if (formFactor === "widget") {
        contents.push(
          this.attach("button", {
            icon: "search",
            className: "search-icon",
            action: "showResults",
          })
        );
      }

      contents = contents.concat(...corePanelContents.call(this));
      let results = contents.find((w) => w.name == "search-menu-results");
      if (results && results.attrs.results) {
        $(".search-menu.search-header").addClass("has-results");
      } else {
        $(".search-menu.search-header").removeClass("has-results");
      }
      if (formFactor === "menu" || showHeaderResults) {
        return contents;
      } else {
        return contents.filter((widget) => {
          return (
            widget.name != "search-menu-results" &&
            widget.name != "search-context"
          );
        });
      }
    },
  });

  api.createWidget("search-widget", {
    tagName: "div.search-widget",
    buildKey: () => "increment-button",

    defaultState() {
      $.ajax("https://surveysparrow.trydiscourse.com/categories.json").then(
        (data) => {
          // some data formatting to html
          // console.log("value is",data.category_list.categories)
          data.category_list.categories.map((val) => {
            console.log("value is", val.name, val.slug);
          });
          this.state.cdata = data.category_list.categories;
        }
      );
      return { cdata: [] };
    },

    html(attrs, state) {
      // if (this.state.cdata.length > 0) {
      //   return h("div.dropdown", [
      //     h("div.dropbtn", { name: "toggle" }, "Category"),
      //     h(
      //       "div.dropdown-content#myDropdown",
      //       this.state.cdata.map((val) =>
      //         h(
      //           "li",
      //           {
      //             name: val.slug,
      //             value: val.name,
      //           },
      //           val.name
      //         )
      //       )
      //     ),
      //   ]);
      // } else {
      //   return h("div.dropdown", [h("div.dropbtn", "Category")]);
      // }
    },

    click(attrs) {
      if (attrs.target.name === "toggle") {
        document.getElementById("myDropdown").classList.toggle("show");
        console.log("handle toggle");
      }
      if (
        this.state.cdata.length > 0 &&
        attrs.target.name !== "" &&
        attrs.target.name !== "toggle" &&
        attrs.target.name !== undefined
      ) {
        $("#search-term").val(`#${attrs.target.name}`);
        document.getElementById("myDropdown").classList.remove("show");
      }
    },

    clickOutside() {
      document.getElementById("myDropdown").classList.remove("show");
    },
  });

  api.decorateWidget("search-widget:after", function (helper) {
    const searchWidget = helper.widget,
      appController = helper.register.lookup("controller:application"),
      searchMenuVisible = searchWidget.state.searchVisible;
    if (!searchMenuVisible && !searchWidget.attrs.topic) {
      return helper.attach("search-menu", {
        contextEnabled: searchWidget.state.contextEnabled,
        formFactor: "widget",
      });
    }
  });
});
