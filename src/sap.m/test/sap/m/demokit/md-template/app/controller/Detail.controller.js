sap.ui.define([
		"sap/ui/demo/mdtemplate/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device"
	], function (BaseController, JSONModel, Device) {
	"use strict";

	return BaseController.extend("sap.ui.demo.mdtemplate.controller.Detail", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit : function () {
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this._oLineItemsList = this.byId("lineItemsList");

			// When there is a list displayed, bind to the first item.
			if (!Device.system.phone) {
				this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			}

			// Update the line item list counter after data is loaded or updated
			this._oLineItemsList.attachEvent("updateFinished", function (oData) {
				this._updateListItemCount(oData.getParameter("total"));
			}, this);

			// Set the detail page busy after the metadata has been loaded successfully
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(function () {
					this.getView().setBusyIndicatorDelay(0);
					this.getView().setBusy(true);
				}.bind(this)
			);

			// Control state model
			this._oViewModel = new JSONModel({
				lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			this.setModel(this._oViewModel, 'view');
		},


		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * This function makes sure that the details of the first item in
		 * in the master list are displayed when the app is started with
		 * the 'default' URL, i.e. a URL that does not deep link to a specific
		 * object or object and line item.
		 *
		 * This 'default' URL is then matched to the 'master' route which triggers
		 * this function to be called. Herein, the ListSelector is used to wait
		 * for the master list to be loaded. After that, the binding context path to
		 * the first master list item is returned, which can finally be bound to
		 * the detail view.
		 *
		 * This is only necessary once though, because the master list does not fire
		 * a 'select' event when it selects its first item initially. Afterwards, the
		 * master controller's 'select' handler takes care of keeping the objects to be
		 * displayed in the detail view up to date.
		 *
		 * If the list has no entries, the app displays a 'No Items' view instead of
		 * the detail view.
		 *
		 * @function
		 * @param oEvent pattern match event in route 'master'
		 * @private
		 */
		_onMasterMatched : function () {
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(function (mParams) {
				if (mParams.path) {
					this._bindView(mParams.path);
				}
			}.bind(this),
			function () {
				this.getRouter().getTargets().display("detailNoObjectsAvailable");
			}.bind(this));
		},


		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 *
		 * @function
		 * @param oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function (oEvent) {
			var sObjectPath = "/Objects('" + oEvent.getParameter("arguments").objectId + "')";
			this._bindView(sObjectPath);
		},


		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 *
		 * @function
		 * @private
		 */
		_bindView : function (sObjectPath) {
			var oView = this.getView().bindElement(sObjectPath, {expand : "LineItems"});

			this.getModel().whenThereIsDataForTheElementBinding(oView.getElementBinding()).then(
				function (sPath) {
					this.getView().setBusyIndicatorDelay(null);
					this.getView().setBusy(false);
					this.getOwnerComponent().oListSelector.selectAListItem(sPath);
				}.bind(this),
				function () {
					this.getView().setBusyIndicatorDelay(null);
					this.getView().setBusy(false);
					this.getRouter().getTargets().display("detailObjectNotFound");
					// if object could not be found, the selection in the master list
					// does not make sense anymore.
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
				}.bind(this)
			);

		},

		/**
		 * Sets the item count on the line item list header
		 * @param {integer} iTotlaItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount : function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oLineItemsList.getBinding('items').isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading")
				}
				this._oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		}
	});

}, /* bExport= */ true);
