/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(['require',
    'backbone',
    'hbs!tmpl/entity/EntityLabelDefineView_tmpl',
    'models/VEntity',
    'utils/Utils',
    'utils/Messages',
    'utils/Enums',
    'utils/CommonViewFunction',
], function(require, Backbone, EntityLabelDefineView_tmpl, VEntity, Utils, Messages, Enums, CommonViewFunction) {
    'use strict';

    return Backbone.Marionette.LayoutView.extend({
        _viewName: 'REntityLabelDefineView',
        template: EntityLabelDefineView_tmpl,
        templateHelpers: function() {
            return {
                swapItem: this.swapItem,
                labels: this.labels,
                saveLabels: this.saveLabels,
                readOnlyEntity: this.readOnlyEntity,
                div_1: this.dynamicId_1,
                div_2: this.dynamicId_2
            };
        },
        ui: {
            addLabelOptions: "[data-id='addLabelOptions']",
            addLabels: "[data-id='addLabels']",
            saveLabels: "[data-id='saveLabels']"
        },
        events: function() {
            var events = {};
            events["change " + this.ui.addLabelOptions] = 'onChangeLabelChange';
            events["click " + this.ui.addLabels] = 'handleBtnClick';
            events["click " + this.ui.saveLabels] = 'saveUserDefinedLabels';
            return events;
        },
        initialize: function(options) {
            var self = this;
            _.extend(this, _.pick(options, 'entity', 'customFilter'));
            this.swapItem = false, this.saveLabels = false;
            this.readOnlyEntity = this.customFilter === undefined ? Enums.entityStateReadOnly[this.entity.status] : this.customFilter;
            this.entityModel = new VEntity(this.entity);
            this.labels = this.entity.labels || [];
            this.dynamicId_1 = CommonViewFunction.getRandomIdAndAnchor();
            this.dynamicId_2 = CommonViewFunction.getRandomIdAndAnchor();
        },
        onRender: function() {
            this.populateLabelOptions();
        },
        bindEvents: function() {},
        populateLabelOptions: function() {
            var that = this,
                str = this.labels.map(function(label) {
                    return "<option selected > " + label + " </option>";
                });
            this.ui.addLabelOptions.html(str);
            this.ui.addLabelOptions.select2({
                placeholder: "Select Label",
                allowClear: false,
                tags: true,
                multiple: true,
                matcher: function(params, data) {
                    if (params.term === data.text) {
                        return data;
                    }
                    return null;
                },
                templateResult: this.formatResultSearch
            });
        },
        formatResultSearch: function(state) {
            if (!state.id) {
                return state.text;
            }
            if (!state.element) {
                return $("<span>Add<strong> '" + state.text + "'</strong></span>");
            }
        },
        onChangeLabelChange: function() {
            this.labels = this.ui.addLabelOptions.val().map(function(v) { return _.escape(v) });
        },
        handleBtnClick: function() {
            this.swapItem = !this.swapItem;
            if (this.customFilter === undefined) {
                this.saveLabels = this.swapItem === true ? true : false;
            } else {
                this.saveLabels = false;
            }
            this.render();
        },
        saveUserDefinedLabels: function() {
            var that = this;
            var entityJson = that.entityModel.toJSON();
            if (entityJson.labels !== undefined || this.labels.length !== 0) {
                var payload = this.labels;
                that.entityModel.saveEntityLabels(entityJson.guid, {
                    data: JSON.stringify(payload),
                    type: 'POST',
                    success: function() {
                        var msg = entityJson.labels === undefined ? 'addSuccessMessage' : 'editSuccessMessage',
                        caption = "One or more label";
                        if (payload.length === 0) {
                            msg = 'removeSuccessMessage';
                            caption = "One or more existing label";
                            that.entityModel.unset('labels');
                        } else {
                            that.entityModel.set('labels', payload);
                        }
                        Utils.notifySuccess({
                            content: caption + Messages.getAbbreviationMsg(true, msg)
                        });
                        that.swapItem = false;
                        that.saveLabels = false;
                        that.render();
                    },
                    error: function(e) {
                        that.ui.saveLabels && that.ui.saveLabels.length > 0 && that.ui.saveLabels[0].setAttribute("disabled", false);
                        Utils.notifySuccess({
                            content: e.message
                        });
                    },
                    complete: function() {
                        that.ui.saveLabels && that.ui.saveLabels.length > 0 && that.ui.saveLabels[0].setAttribute("disabled", false);
                        that.render();
                    }
                });
            }
        }
    });
});