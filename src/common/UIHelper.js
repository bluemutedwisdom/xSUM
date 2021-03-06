import createHashHistory from 'history/lib/createHashHistory';
import {useRouterHistory} from 'react-router';
import {randomBytes} from 'crypto';

import userApi from '../api/userApi';
import tenantApi from '../api/tenantApi';

import * as Config from '../config/config';
import * as AppConstants from '../constants/AppConstants';
import * as MessageConstants from '../constants/MessageConstants';

// Redirect to login page
export function redirectTo(route, data) {
    useRouterHistory(createHashHistory)().push({
        pathname: route,
        query: data
    });
}

// Cookies
export function setCookie(cname, cvalue, exmins) {
    var d = new Date();
    d.setTime(d.getTime() + (exmins * 60 * 1000));
    var expires = 'expires=' + d.toUTCString();

    if (typeof document !== 'undefined') {
        document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
    }

}

export function getCookie(cname) {
    var name = cname + '=';

    if (typeof document !== 'undefined') {
        var ca = document.cookie.split(';');

        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }

    }

    return '';
}

export function deleteCookie(cname) {
    var d = new Date(); //Create an date object
    d.setTime(d.getTime() - (1000*60*60*24)); //Set the time to the past. 1000 milliseonds = 1 second
    var expires = "expires=" + d.toGMTString(); //Compose the expirartion date
    document.cookie = cname+"="+"; "+expires;//Set the cookie with name and the expiration date
}

// Set local storage value
// Key and value are strings
export function setLocalStorageValue(key, value) {
    localStorage.setItem(key, value);
}

export function getLocalStorageValue(key) {
    return localStorage.getItem(key);
}

export function getLeftState() {
    var isNavCollapse = getLocalStorageValue(AppConstants.LEFTNAV_COLLAPSE_STATE);

    if (isNavCollapse == 'true') {
        return true;
    } else {
        return false;
    }
}

export function removeLocalStorageValue(key) {
    localStorage.removeItem(key);
}

export function toTitleCase(str) {

    if (str === undefined) {
        return '';
    } else {
        return str.replace(
            /\w\S*/g,
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }

}

export function isNameHasError(value) {
    return !RegExp(AppConstants.NAME_PATTERN).test(value);
}

export function isUrlHasError(value) {
    return !RegExp(AppConstants.URL_PATTERN).test(value);
}

export function isEmailHasError(value) {
    return !RegExp(AppConstants.EMAIL_PATTERN).test(value);
}

export function isPasswordHasError(value) {
    return !RegExp(AppConstants.PASSWORD_PATTERN).test(value);
}

export function getRandomHexaValue() {
    return randomBytes(10).toString('hex');
}

export function replaceCharacter(stringToReplace, replace, replaceFrom) {
    return stringToReplace.replace(new RegExp(replace, 'g'), replaceFrom);
}

export function getRoleForUserFromTenant(tenantID, userObject, isTitle) {
    var role;

    for (let tenant of userObject.tenants) {

        if (tenant.tenantID === tenantID) {
            role = tenant.role;
        }

    }

    return (isTitle) ? toTitleCase(role) : role;
}

export function getUserData(loggedUserObj, context, callBackFunction) {
    var urlToGetUserData = Config.API_URL + AppConstants.GET_USER_DATA_API;

    context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_USER});
    userApi.getUser(urlToGetUserData, {email: loggedUserObj.email}).then((data) => {

        loggedUserObj = data.user;

        context.setState (
            {
                isLoading: false,
                loadingMessage: '',
                loggedUserObj
            }
        );

        callBackFunction && callBackFunction(data.user, context);
    });
}

export function getAllTenantsData(user, context, callBackFunction) {
    var urlToGetTenantData = Config.API_URL + AppConstants.GET_TENANT_DATA_API;
    context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_TENANTS});
    tenantApi.getAllTenantsFrom(urlToGetTenantData, {userID: user._id}).then((data) => {
        var tenantList = [];
        var selectedTenant = context.state.selectedTenant;

        for (var i = 0; i < data.length; i++) {
            var tenant = data[i];
            tenant.email = {value: data[i].email, error: {}};
            tenant.password = {value: '', error: {}};
            tenantList.push(tenant);

            if (context.props.location.query.userObj) {
                var userObj = JSON.parse(context.props.location.query.userObj);

                if (userObj.tenantID === tenant._id) {
                    selectedTenant = tenant;
                }

            }

        }

        if (selectedTenant) {
            selectedTenant = tenantList[0];
        }

        callBackFunction && callBackFunction(user, selectedTenant, context);

        context.setState (
            {
                isLoading: false,
                loadingMessage: '',
                tenantList: tenantList,
                selectedTenant: selectedTenant
            }
        );

    });
}
