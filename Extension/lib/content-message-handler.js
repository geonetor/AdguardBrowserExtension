/* global Prefs, Utils, AntiBannerFiltersId, EventNotifierTypes, LogEvents, antiBannerService, WorkaroundUtils,
 framesMap, adguardApplication, filteringLog, webRequestService, EventNotifier */

/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */
var ContentMessageHandler = function () {
    this.handleMessage = this.handleMessage.bind(this);
};

ContentMessageHandler.prototype = {

    eventListeners: Object.create(null),

    handleMessage: function (message, sender, callback) {
        switch (message.type) {
            case 'unWhiteListFrame':
                antiBannerService.unWhiteListFrame(message.frameInfo);
                break;
            case 'addRuleToApp':
                adguardApplication.addRuleToApp(message.ruleText);
                break;
            case 'removeRuleFromApp':
                adguardApplication.removeRuleFromApp(message.ruleText);
                break;
            case 'addEventListener':
                return this._processAddEventListener(message, sender);
            case 'removeListener':
                var listenerId = message.listenerId;
                EventNotifier.removeListener(listenerId);
                delete this.eventListeners[listenerId];
                break;
            case 'initializeFrameScript':
                return this._processInitializeFrameScriptRequest();
            case 'changeUserSetting':
                adguard.settings.setProperty(message.key, message.value);
                break;
            case 'initializeFiltersOnInstall':
                antiBannerService.initializeFiltersOnInstall(function (enabledFilterIds) {
                    callback({enabledFilterIds: enabledFilterIds});
                });
                return true; // Async
            case 'addAndEnableFilter':
                antiBannerService.addAndEnableFilter(message.filterId);
                break;
            case 'removeAntiBannerFilter':
                antiBannerService.removeAntiBannerFilter(message.filterId);
                break;
            case 'enableAntiBannerFilter':
                antiBannerService.enableAntiBannerFilter(message.filterId);
                break;
            case 'disableAntiBannerFilter':
                antiBannerService.disableAntiBannerFilter(message.filterId);
                break;
            case 'getWhiteListDomains':
                var whiteListDomains = antiBannerService.getWhiteListDomains(message.offset, message.limit, message.text);
                return {rules: whiteListDomains};
            case 'getUserFilters':
                var userFilters = antiBannerService.getUserFilters(message.offset, message.limit, message.text);
                return {rules: userFilters};
            case 'checkAntiBannerFiltersUpdate':
                adguard.ui.checkAntiBannerFiltersUpdate();
                break;
            case 'getAntiBannerFiltersForOptionsPage':
                var renderedFilters = antiBannerService.getAntiBannerFiltersForOptionsPage();
                return {filters: renderedFilters};
            case 'changeDefaultWhiteListMode':
                adguard.whitelist.changeDefaultWhiteListMode(message.enabled);
                break;
            case 'clearUserFilter':
                antiBannerService.clearUserFilter();
                break;
            case 'clearWhiteListFilter':
                adguard.whitelist.clearWhiteList();
                break;
            case 'addWhiteListDomains':
                adguard.whitelist.addToWhiteListArray(message.domains);
                break;
            case 'removeWhiteListDomain':
                adguard.whitelist.removeFromWhiteList(message.text);
                break;
            case 'addUserFilterRule':
                antiBannerService.addUserFilterRule(message.text);
                break;
            case 'removeUserFilter':
                antiBannerService.removeUserFilter(message.text);
                break;
            case 'addUserFilterRules':
                antiBannerService.addUserFilterRules(message.rules);
                break;
            case 'onFiltersSubscriptionChange':
                antiBannerService.onFiltersSubscriptionChange(message.filterIds);
                break;
            case 'getFiltersMetadata':
                return this._processGetFiltersMetadata();
            case 'openThankYouPage':
                adguard.ui.openThankYouPage();
                break;
            case 'openExtensionStore':
                adguard.ui.openExtensionStore();
                break;
            case 'openFilteringLog':
                adguard.browserAction.close();
                adguard.ui.openFilteringLog(message.tabId);
                break;
            case 'openExportRulesTab':
                adguard.ui.openExportRulesTab(message.whitelist);
                break;
            case 'openSafebrowsingTrusted':
                adguard.safebrowsing.addToSafebrowsingTrusted(message.url);
                adguard.tabs.getActive(function (tab) {
                    adguard.tabs.reload(tab.tabId, message.url);
                });
                break;
            case 'openTab':
                adguard.ui.openTab(message.url, message.options);
                adguard.browserAction.close();
                break;
            case 'resetBlockedAdsCount':
                framesMap.resetBlockedAdsCount();
                adguard.browserAction.close();
                break;
            case 'getSelectorsAndScripts':
                if (WorkaroundUtils.isFacebookIframe(message.documentUrl)) {
                    return {};
                }
                var cssAndScripts = webRequestService.processGetSelectorsAndScripts(sender.tab, message.documentUrl, message.loadTruncatedCss);
                return cssAndScripts || {};
            case 'checkWebSocketRequest':
                var block = webRequestService.checkWebSocketRequest(sender.tab, message.elementUrl, message.documentUrl);
                return {block: block, requestId: message.requestId};
            case 'processShouldCollapse':
                var collapse = webRequestService.processShouldCollapse(sender.tab, message.elementUrl, message.documentUrl, message.requestType);
                return {collapse: collapse, requestId: message.requestId};
            case 'processShouldCollapseMany':
                var requests = webRequestService.processShouldCollapseMany(sender.tab, message.documentUrl, message.requests);
                return {requests: requests};
            case 'loadAssistant':
                return this._processLoadAssistant();
            case 'addUserRule':
                antiBannerService.addUserFilterRule(message.ruleText);
                if (framesMap.isTabAdguardDetected(sender.tab)) {
                    adguardApplication.addRuleToApp(message.ruleText);
                }
                break;
            case 'onOpenFilteringLogPage':
                filteringLog.onOpenFilteringLogPage();
                break;
            case 'onCloseFilteringLogPage':
                filteringLog.onCloseFilteringLogPage();
                break;
            case 'reloadTabById':
                filteringLog.reloadTabById(message.tabId);
                break;
            case 'clearEventsByTabId':
                filteringLog.clearEventsByTabId(message.tabId);
                break;
            case 'getTabFrameInfoById':
                var frameInfo = filteringLog.getTabFrameInfoById(message.tabId);
                return {frameInfo: frameInfo};
            case 'getTabInfoById':
                var tabInfo = filteringLog.getTabInfoById(message.tabId);
                return {tabInfo: filteringLog.serializeTabInfo(tabInfo)};
            case 'synchronizeOpenTabs':
                filteringLog.synchronizeOpenTabs(function () {
                    callback({});
                });
                return true; // Async
            case 'checkSubscriptionUrl':
                var filterMetadata = antiBannerService.findFilterMetadataBySubscriptionUrl(message.url);
                var confirmText;
                if (filterMetadata) {
                    //ok, filter found
                    confirmText = adguard.i18n.getMessage('abp_subscribe_confirm_enable', [filterMetadata.name]);
                } else {
                    //filter not found
                    confirmText = adguard.i18n.getMessage('abp_subscribe_confirm_import', [message.title]);
                }
                return {confirmText: confirmText};
            case 'enableSubscription':
                antiBannerService.processAbpSubscriptionUrl(message.url, function (rulesAddedCount) {
                    callback({
                        title: adguard.i18n.getMessage('abp_subscribe_confirm_import_finished_title'),
                        text: adguard.i18n.getMessage('abp_subscribe_confirm_import_finished_text', [rulesAddedCount])
                    });
                });
                return true; // Async
            // Popup methods
            case 'popupReady':
                adguard.tabs.getActive(function (tab) {
                    var tabInfo = framesMap.getFrameInfo(tab);
                    var filteringInfo = filteringLog.getTabInfo(tab);
                    callback({
                        tabInfo: tabInfo,
                        filteringInfo: filteringInfo
                    });
                });
                return true; // Async
            case 'addWhiteListDomainPopup':
                adguard.tabs.getActive(function (tab) {
                    adguard.ui.whiteListTab(tab);
                });
                break;
            case 'removeWhiteListDomainPopup':
                adguard.tabs.getActive(function (tab) {
                    adguard.ui.unWhiteListTab(tab);
                });
                break;
            case 'changeApplicationFilteringDisabled':
                adguard.ui.changeApplicationFilteringDisabled(message.disabled);
                break;
            case 'openSiteReportTab':
                adguard.ui.openSiteReportTab(message.url);
                adguard.browserAction.close();
                break;
            case 'openSettingsTab':
                adguard.ui.openSettingsTab();
                adguard.browserAction.close();
                break;
            case 'openAssistant':
                adguard.ui.openAssistant();
                adguard.browserAction.close();
                break;
            case 'resizePanelPopup':
                adguard.browserAction.resize(message.width, message.height);
                break;
            case 'sendFeedback':
                antiBannerService.sendFeedback(message.url, message.topic, message.comment);
                break;
            default :
                throw 'Unknown message: ' + message;
        }
    },

    _processInitializeFrameScriptRequest: function () {

        var enabledFilters = Object.create(null);

        for (var key in AntiBannerFiltersId) {
            if (AntiBannerFiltersId.hasOwnProperty(key)) {
                var filterId = AntiBannerFiltersId[key];
                var enabled = antiBannerService.isAntiBannerFilterEnabled(filterId);
                if (enabled) {
                    enabledFilters[filterId] = true;
                }
            }
        }

        return {
            userSettings: adguard.settings.getAllSettings(),
            enabledFilters: enabledFilters,
            filtersMetadata: antiBannerService.getFiltersMetadata(),
            requestFilterInfo: antiBannerService.getRequestFilterInfo(),
            contentBlockerInfo: antiBannerService.getContentBlockerInfo(),
            environmentOptions: {
                isMacOs: Utils.isMacOs(),
                isSafariBrowser: Utils.isSafariBrowser(),
                isContentBlockerEnabled: Utils.isContentBlockerEnabled(),
                Prefs: {
                    locale: Prefs.locale,
                    mobile: Prefs.mobile
                }
            },
            constants: {
                AntiBannerFiltersId: AntiBannerFiltersId,
                EventNotifierTypes: EventNotifierTypes,
                LogEvents: LogEvents
            }
        };
    },

    _processAddEventListener: function (message, sender) {
        var self = this;
        var listenerId = EventNotifier.addSpecifiedListener(message.events, function () {
            var sender = self.eventListeners[listenerId];
            if (sender) {
                adguard.tabs.sendMessage(sender.tab.tabId, {
                    type: 'notifyListeners',
                    args: Array.prototype.slice.call(arguments)
                });
            }
        });
        this.eventListeners[listenerId] = sender;
        return {listenerId: listenerId};
    },

    _processGetFiltersMetadata: function () {
        var groupsMeta = antiBannerService.getGroupsMetadata();
        var filtersMeta = Object.create(null);
        var enabledFilters = Object.create(null);
        var installedFilters = Object.create(null);
        for (var i = 0; i < groupsMeta.length; i++) {
            var groupId = groupsMeta[i].groupId;
            var filters = filtersMeta[groupId] = antiBannerService.getFiltersMetadataForGroup(groupId);
            for (var j = 0; j < filters.length; j++) {
                var filter = filters[j];
                var installed = antiBannerService.isAntiBannerFilterInstalled(filter.filterId);
                var enabled = antiBannerService.isAntiBannerFilterEnabled(filter.filterId);
                if (installed) {
                    installedFilters[filter.filterId] = true;
                }
                if (enabled) {
                    enabledFilters[filter.filterId] = true;
                }
            }
        }
        return {
            groups: groupsMeta,
            filters: filtersMeta,
            enabledFilters: enabledFilters,
            installedFilters: installedFilters
        };
    },

    _processLoadAssistant: function () {
        var options = {
            cssLink: adguard.getURL('lib/content-script/assistant/css/assistant.css')
        };
        var ids = [
            'assistant_select_element',
            'assistant_select_element_ext',
            'assistant_select_element_cancel',
            'assistant_block_element',
            'assistant_block_element_explain',
            'assistant_slider_explain',
            'assistant_slider_if_hide',
            'assistant_slider_min',
            'assistant_slider_max',
            'assistant_extended_settings',
            'assistant_apply_rule_to_all_sites',
            'assistant_block_by_reference',
            'assistant_block_similar',
            'assistant_block',
            'assistant_another_element',
            'assistant_preview',
            'assistant_preview_header',
            'assistant_preview_header_info',
            'assistant_preview_end',
            'assistant_preview_start'
        ];
        options.localization = this._getLocalization(ids);
        return options;
    },

    _getLocalization: function (ids) {
        var result = {};
        for (var id in ids) {
            if (ids.hasOwnProperty(id)) {
                var current = ids[id];
                result[current] = adguard.i18n.getMessage(current);
            }
        }
        return result;
    }
};

var contentMessageHandler = new ContentMessageHandler(); // jshint ignore:line