const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'finance',
  serviceId: 'finance-tracker-app-service',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

function createUserFromGoogle(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateUserFromGoogle', inputVars, inputOpts);
}
exports.createUserFromGoogle = createUserFromGoogle;

function setUserType(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetUserType', inputVars, inputOpts);
}
exports.setUserType = setUserType;

function selectMyColorScheme(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SelectMyColorScheme', inputVars, inputOpts);
}
exports.selectMyColorScheme = selectMyColorScheme;

function clearMyColorScheme(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ClearMyColorScheme', undefined, inputOpts);
}
exports.clearMyColorScheme = clearMyColorScheme;

function selectMyPerformanceMode(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SelectMyPerformanceMode', inputVars, inputOpts);
}
exports.selectMyPerformanceMode = selectMyPerformanceMode;

function selectMyBackgroundOpacity(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SelectMyBackgroundOpacity', inputVars, inputOpts);
}
exports.selectMyBackgroundOpacity = selectMyBackgroundOpacity;

function selectMyExternalAccountLinkTemplate(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, false);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SelectMyExternalAccountLinkTemplate', inputVars, inputOpts);
}
exports.selectMyExternalAccountLinkTemplate = selectMyExternalAccountLinkTemplate;

function selectMyCardStyle(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SelectMyCardStyle', inputVars, inputOpts);
}
exports.selectMyCardStyle = selectMyCardStyle;

function selectMySquareCorners(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SelectMySquareCorners', inputVars, inputOpts);
}
exports.selectMySquareCorners = selectMySquareCorners;

function selectMyBordersEnabled(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SelectMyBordersEnabled', inputVars, inputOpts);
}
exports.selectMyBordersEnabled = selectMyBordersEnabled;

function selectMyCategoryColorsEnabled(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SelectMyCategoryColorsEnabled', inputVars, inputOpts);
}
exports.selectMyCategoryColorsEnabled = selectMyCategoryColorsEnabled;

function selectMyCurrency(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SelectMyCurrency', inputVars, inputOpts);
}
exports.selectMyCurrency = selectMyCurrency;

function createFamilyMember(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateFamilyMember', inputVars, inputOpts);
}
exports.createFamilyMember = createFamilyMember;

function updateFamilyMember(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateFamilyMember', inputVars, inputOpts);
}
exports.updateFamilyMember = updateFamilyMember;

function renameFamilyMember(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('RenameFamilyMember', inputVars, inputOpts);
}
exports.renameFamilyMember = renameFamilyMember;

function deleteFamilyMember(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('DeleteFamilyMember', inputVars, inputOpts);
}
exports.deleteFamilyMember = deleteFamilyMember;

function upsertCategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpsertCategory', inputVars, inputOpts);
}
exports.upsertCategory = upsertCategory;

function updateCategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateCategory', inputVars, inputOpts);
}
exports.updateCategory = updateCategory;

function createTransaction(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateTransaction', inputVars, inputOpts);
}
exports.createTransaction = createTransaction;

function updateTransaction(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateTransaction', inputVars, inputOpts);
}
exports.updateTransaction = updateTransaction;

function updateTransactionClearCategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateTransactionClearCategory', inputVars, inputOpts);
}
exports.updateTransactionClearCategory = updateTransactionClearCategory;

function markTransactionPosted(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('MarkTransactionPosted', inputVars, inputOpts);
}
exports.markTransactionPosted = markTransactionPosted;

function markTransactionProjected(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('MarkTransactionProjected', inputVars, inputOpts);
}
exports.markTransactionProjected = markTransactionProjected;

function deleteTransaction(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('DeleteTransaction', inputVars, inputOpts);
}
exports.deleteTransaction = deleteTransaction;

function createFamily(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateFamily', inputVars, inputOpts);
}
exports.createFamily = createFamily;

function requestToJoinFamily(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('RequestToJoinFamily', inputVars, inputOpts);
}
exports.requestToJoinFamily = requestToJoinFamily;

function approveJoinRequest(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ApproveJoinRequest', inputVars, inputOpts);
}
exports.approveJoinRequest = approveJoinRequest;

function denyJoinRequest(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('DenyJoinRequest', inputVars, inputOpts);
}
exports.denyJoinRequest = denyJoinRequest;

function cancelMyJoinRequest(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CancelMyJoinRequest', inputVars, inputOpts);
}
exports.cancelMyJoinRequest = cancelMyJoinRequest;

function leaveMyFamily(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('LeaveMyFamily', inputVars, inputOpts);
}
exports.leaveMyFamily = leaveMyFamily;

function regenerateFamilyInviteCode(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('RegenerateFamilyInviteCode', inputVars, inputOpts);
}
exports.regenerateFamilyInviteCode = regenerateFamilyInviteCode;

function createUserSettingForUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateUserSettingForUser', inputVars, inputOpts);
}
exports.createUserSettingForUser = createUserSettingForUser;

function listUsers(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListUsers', undefined, inputOpts);
}
exports.listUsers = listUsers;

function getMyUser(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetMyUser', undefined, inputOpts);
}
exports.getMyUser = getMyUser;

function listColorSchemes(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListColorSchemes', undefined, inputOpts);
}
exports.listColorSchemes = listColorSchemes;

function listUserTypes(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListUserTypes', undefined, inputOpts);
}
exports.listUserTypes = listUserTypes;

function getUserAccessByGoogleUid(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetUserAccessByGoogleUid', inputVars, inputOpts);
}
exports.getUserAccessByGoogleUid = getUserAccessByGoogleUid;

function getUserProvisioningByGoogleUid(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetUserProvisioningByGoogleUid', inputVars, inputOpts);
}
exports.getUserProvisioningByGoogleUid = getUserProvisioningByGoogleUid;

function listFamilyMembers(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, false);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListFamilyMembers', inputVars, inputOpts);
}
exports.listFamilyMembers = listFamilyMembers;

function listCategories(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, false);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListCategories', inputVars, inputOpts);
}
exports.listCategories = listCategories;

function listTransactionsByFamilyMember(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListTransactionsByFamilyMember', inputVars, inputOpts);
}
exports.listTransactionsByFamilyMember = listTransactionsByFamilyMember;

function listMyTransactions(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, false);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListMyTransactions', inputVars, inputOpts);
}
exports.listMyTransactions = listMyTransactions;

function listMyTransactionsByDateRange(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListMyTransactionsByDateRange', inputVars, inputOpts);
}
exports.listMyTransactionsByDateRange = listMyTransactionsByDateRange;

function getFamilyByInviteCode(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetFamilyByInviteCode', inputVars, inputOpts);
}
exports.getFamilyByInviteCode = getFamilyByInviteCode;

function getMyFamilyDetail(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetMyFamilyDetail', undefined, inputOpts);
}
exports.getMyFamilyDetail = getMyFamilyDetail;

function getMyJoinRequests(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetMyJoinRequests', undefined, inputOpts);
}
exports.getMyJoinRequests = getMyJoinRequests;

