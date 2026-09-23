const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'finance',
  service: 'finance-tracker-app-service',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const createUserFromGoogleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUserFromGoogle', inputVars);
}
createUserFromGoogleRef.operationName = 'CreateUserFromGoogle';
exports.createUserFromGoogleRef = createUserFromGoogleRef;

exports.createUserFromGoogle = function createUserFromGoogle(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createUserFromGoogleRef(dcInstance, inputVars));
}
;

const setUserTypeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetUserType', inputVars);
}
setUserTypeRef.operationName = 'SetUserType';
exports.setUserTypeRef = setUserTypeRef;

exports.setUserType = function setUserType(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setUserTypeRef(dcInstance, inputVars));
}
;

const selectMyColorSchemeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SelectMyColorScheme', inputVars);
}
selectMyColorSchemeRef.operationName = 'SelectMyColorScheme';
exports.selectMyColorSchemeRef = selectMyColorSchemeRef;

exports.selectMyColorScheme = function selectMyColorScheme(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(selectMyColorSchemeRef(dcInstance, inputVars));
}
;

const clearMyColorSchemeRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClearMyColorScheme');
}
clearMyColorSchemeRef.operationName = 'ClearMyColorScheme';
exports.clearMyColorSchemeRef = clearMyColorSchemeRef;

exports.clearMyColorScheme = function clearMyColorScheme(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(clearMyColorSchemeRef(dcInstance, inputVars));
}
;

const selectMyPerformanceModeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SelectMyPerformanceMode', inputVars);
}
selectMyPerformanceModeRef.operationName = 'SelectMyPerformanceMode';
exports.selectMyPerformanceModeRef = selectMyPerformanceModeRef;

exports.selectMyPerformanceMode = function selectMyPerformanceMode(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(selectMyPerformanceModeRef(dcInstance, inputVars));
}
;

const selectMyBackgroundOpacityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SelectMyBackgroundOpacity', inputVars);
}
selectMyBackgroundOpacityRef.operationName = 'SelectMyBackgroundOpacity';
exports.selectMyBackgroundOpacityRef = selectMyBackgroundOpacityRef;

exports.selectMyBackgroundOpacity = function selectMyBackgroundOpacity(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(selectMyBackgroundOpacityRef(dcInstance, inputVars));
}
;

const selectMyExternalAccountLinkTemplateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SelectMyExternalAccountLinkTemplate', inputVars);
}
selectMyExternalAccountLinkTemplateRef.operationName = 'SelectMyExternalAccountLinkTemplate';
exports.selectMyExternalAccountLinkTemplateRef = selectMyExternalAccountLinkTemplateRef;

exports.selectMyExternalAccountLinkTemplate = function selectMyExternalAccountLinkTemplate(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars);
  return executeMutation(selectMyExternalAccountLinkTemplateRef(dcInstance, inputVars));
}
;

const selectMyCardStyleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SelectMyCardStyle', inputVars);
}
selectMyCardStyleRef.operationName = 'SelectMyCardStyle';
exports.selectMyCardStyleRef = selectMyCardStyleRef;

exports.selectMyCardStyle = function selectMyCardStyle(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(selectMyCardStyleRef(dcInstance, inputVars));
}
;

const selectMySquareCornersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SelectMySquareCorners', inputVars);
}
selectMySquareCornersRef.operationName = 'SelectMySquareCorners';
exports.selectMySquareCornersRef = selectMySquareCornersRef;

exports.selectMySquareCorners = function selectMySquareCorners(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(selectMySquareCornersRef(dcInstance, inputVars));
}
;

const selectMyBordersEnabledRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SelectMyBordersEnabled', inputVars);
}
selectMyBordersEnabledRef.operationName = 'SelectMyBordersEnabled';
exports.selectMyBordersEnabledRef = selectMyBordersEnabledRef;

exports.selectMyBordersEnabled = function selectMyBordersEnabled(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(selectMyBordersEnabledRef(dcInstance, inputVars));
}
;

const selectMyCategoryColorsEnabledRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SelectMyCategoryColorsEnabled', inputVars);
}
selectMyCategoryColorsEnabledRef.operationName = 'SelectMyCategoryColorsEnabled';
exports.selectMyCategoryColorsEnabledRef = selectMyCategoryColorsEnabledRef;

exports.selectMyCategoryColorsEnabled = function selectMyCategoryColorsEnabled(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(selectMyCategoryColorsEnabledRef(dcInstance, inputVars));
}
;

const selectMyCurrencyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SelectMyCurrency', inputVars);
}
selectMyCurrencyRef.operationName = 'SelectMyCurrency';
exports.selectMyCurrencyRef = selectMyCurrencyRef;

exports.selectMyCurrency = function selectMyCurrency(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(selectMyCurrencyRef(dcInstance, inputVars));
}
;

const createFamilyMemberRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateFamilyMember', inputVars);
}
createFamilyMemberRef.operationName = 'CreateFamilyMember';
exports.createFamilyMemberRef = createFamilyMemberRef;

exports.createFamilyMember = function createFamilyMember(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createFamilyMemberRef(dcInstance, inputVars));
}
;

const updateFamilyMemberRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateFamilyMember', inputVars);
}
updateFamilyMemberRef.operationName = 'UpdateFamilyMember';
exports.updateFamilyMemberRef = updateFamilyMemberRef;

exports.updateFamilyMember = function updateFamilyMember(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateFamilyMemberRef(dcInstance, inputVars));
}
;

const renameFamilyMemberRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RenameFamilyMember', inputVars);
}
renameFamilyMemberRef.operationName = 'RenameFamilyMember';
exports.renameFamilyMemberRef = renameFamilyMemberRef;

exports.renameFamilyMember = function renameFamilyMember(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(renameFamilyMemberRef(dcInstance, inputVars));
}
;

const deleteFamilyMemberRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteFamilyMember', inputVars);
}
deleteFamilyMemberRef.operationName = 'DeleteFamilyMember';
exports.deleteFamilyMemberRef = deleteFamilyMemberRef;

exports.deleteFamilyMember = function deleteFamilyMember(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteFamilyMemberRef(dcInstance, inputVars));
}
;

const upsertCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertCategory', inputVars);
}
upsertCategoryRef.operationName = 'UpsertCategory';
exports.upsertCategoryRef = upsertCategoryRef;

exports.upsertCategory = function upsertCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertCategoryRef(dcInstance, inputVars));
}
;

const updateCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateCategory', inputVars);
}
updateCategoryRef.operationName = 'UpdateCategory';
exports.updateCategoryRef = updateCategoryRef;

exports.updateCategory = function updateCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateCategoryRef(dcInstance, inputVars));
}
;

const createTransactionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateTransaction', inputVars);
}
createTransactionRef.operationName = 'CreateTransaction';
exports.createTransactionRef = createTransactionRef;

exports.createTransaction = function createTransaction(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createTransactionRef(dcInstance, inputVars));
}
;

const updateTransactionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateTransaction', inputVars);
}
updateTransactionRef.operationName = 'UpdateTransaction';
exports.updateTransactionRef = updateTransactionRef;

exports.updateTransaction = function updateTransaction(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateTransactionRef(dcInstance, inputVars));
}
;

const updateTransactionClearCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateTransactionClearCategory', inputVars);
}
updateTransactionClearCategoryRef.operationName = 'UpdateTransactionClearCategory';
exports.updateTransactionClearCategoryRef = updateTransactionClearCategoryRef;

exports.updateTransactionClearCategory = function updateTransactionClearCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateTransactionClearCategoryRef(dcInstance, inputVars));
}
;

const markTransactionPostedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkTransactionPosted', inputVars);
}
markTransactionPostedRef.operationName = 'MarkTransactionPosted';
exports.markTransactionPostedRef = markTransactionPostedRef;

exports.markTransactionPosted = function markTransactionPosted(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(markTransactionPostedRef(dcInstance, inputVars));
}
;

const markTransactionProjectedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkTransactionProjected', inputVars);
}
markTransactionProjectedRef.operationName = 'MarkTransactionProjected';
exports.markTransactionProjectedRef = markTransactionProjectedRef;

exports.markTransactionProjected = function markTransactionProjected(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(markTransactionProjectedRef(dcInstance, inputVars));
}
;

const deleteTransactionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteTransaction', inputVars);
}
deleteTransactionRef.operationName = 'DeleteTransaction';
exports.deleteTransactionRef = deleteTransactionRef;

exports.deleteTransaction = function deleteTransaction(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteTransactionRef(dcInstance, inputVars));
}
;

const createFamilyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateFamily', inputVars);
}
createFamilyRef.operationName = 'CreateFamily';
exports.createFamilyRef = createFamilyRef;

exports.createFamily = function createFamily(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createFamilyRef(dcInstance, inputVars));
}
;

const requestToJoinFamilyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RequestToJoinFamily', inputVars);
}
requestToJoinFamilyRef.operationName = 'RequestToJoinFamily';
exports.requestToJoinFamilyRef = requestToJoinFamilyRef;

exports.requestToJoinFamily = function requestToJoinFamily(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(requestToJoinFamilyRef(dcInstance, inputVars));
}
;

const approveJoinRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ApproveJoinRequest', inputVars);
}
approveJoinRequestRef.operationName = 'ApproveJoinRequest';
exports.approveJoinRequestRef = approveJoinRequestRef;

exports.approveJoinRequest = function approveJoinRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(approveJoinRequestRef(dcInstance, inputVars));
}
;

const denyJoinRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DenyJoinRequest', inputVars);
}
denyJoinRequestRef.operationName = 'DenyJoinRequest';
exports.denyJoinRequestRef = denyJoinRequestRef;

exports.denyJoinRequest = function denyJoinRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(denyJoinRequestRef(dcInstance, inputVars));
}
;

const cancelMyJoinRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CancelMyJoinRequest', inputVars);
}
cancelMyJoinRequestRef.operationName = 'CancelMyJoinRequest';
exports.cancelMyJoinRequestRef = cancelMyJoinRequestRef;

exports.cancelMyJoinRequest = function cancelMyJoinRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(cancelMyJoinRequestRef(dcInstance, inputVars));
}
;

const leaveMyFamilyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'LeaveMyFamily', inputVars);
}
leaveMyFamilyRef.operationName = 'LeaveMyFamily';
exports.leaveMyFamilyRef = leaveMyFamilyRef;

exports.leaveMyFamily = function leaveMyFamily(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(leaveMyFamilyRef(dcInstance, inputVars));
}
;

const regenerateFamilyInviteCodeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegenerateFamilyInviteCode', inputVars);
}
regenerateFamilyInviteCodeRef.operationName = 'RegenerateFamilyInviteCode';
exports.regenerateFamilyInviteCodeRef = regenerateFamilyInviteCodeRef;

exports.regenerateFamilyInviteCode = function regenerateFamilyInviteCode(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(regenerateFamilyInviteCodeRef(dcInstance, inputVars));
}
;

const createUserSettingForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUserSettingForUser', inputVars);
}
createUserSettingForUserRef.operationName = 'CreateUserSettingForUser';
exports.createUserSettingForUserRef = createUserSettingForUserRef;

exports.createUserSettingForUser = function createUserSettingForUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createUserSettingForUserRef(dcInstance, inputVars));
}
;

const createSelfFamilyMemberForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSelfFamilyMemberForUser', inputVars);
}
createSelfFamilyMemberForUserRef.operationName = 'CreateSelfFamilyMemberForUser';
exports.createSelfFamilyMemberForUserRef = createSelfFamilyMemberForUserRef;

exports.createSelfFamilyMemberForUser = function createSelfFamilyMemberForUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSelfFamilyMemberForUserRef(dcInstance, inputVars));
}
;

const listUsersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUsers');
}
listUsersRef.operationName = 'ListUsers';
exports.listUsersRef = listUsersRef;

exports.listUsers = function listUsers(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listUsersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getMyUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyUser');
}
getMyUserRef.operationName = 'GetMyUser';
exports.getMyUserRef = getMyUserRef;

exports.getMyUser = function getMyUser(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMyUserRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listColorSchemesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListColorSchemes');
}
listColorSchemesRef.operationName = 'ListColorSchemes';
exports.listColorSchemesRef = listColorSchemesRef;

exports.listColorSchemes = function listColorSchemes(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listColorSchemesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listUserTypesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUserTypes');
}
listUserTypesRef.operationName = 'ListUserTypes';
exports.listUserTypesRef = listUserTypesRef;

exports.listUserTypes = function listUserTypes(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listUserTypesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getUserAccessByGoogleUidRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserAccessByGoogleUid', inputVars);
}
getUserAccessByGoogleUidRef.operationName = 'GetUserAccessByGoogleUid';
exports.getUserAccessByGoogleUidRef = getUserAccessByGoogleUidRef;

exports.getUserAccessByGoogleUid = function getUserAccessByGoogleUid(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getUserAccessByGoogleUidRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getUserProvisioningByGoogleUidRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserProvisioningByGoogleUid', inputVars);
}
getUserProvisioningByGoogleUidRef.operationName = 'GetUserProvisioningByGoogleUid';
exports.getUserProvisioningByGoogleUidRef = getUserProvisioningByGoogleUidRef;

exports.getUserProvisioningByGoogleUid = function getUserProvisioningByGoogleUid(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getUserProvisioningByGoogleUidRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listFamilyMembersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFamilyMembers', inputVars);
}
listFamilyMembersRef.operationName = 'ListFamilyMembers';
exports.listFamilyMembersRef = listFamilyMembersRef;

exports.listFamilyMembers = function listFamilyMembers(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listFamilyMembersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listCategoriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCategories', inputVars);
}
listCategoriesRef.operationName = 'ListCategories';
exports.listCategoriesRef = listCategoriesRef;

exports.listCategories = function listCategories(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listCategoriesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listTransactionsByFamilyMemberRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListTransactionsByFamilyMember', inputVars);
}
listTransactionsByFamilyMemberRef.operationName = 'ListTransactionsByFamilyMember';
exports.listTransactionsByFamilyMemberRef = listTransactionsByFamilyMemberRef;

exports.listTransactionsByFamilyMember = function listTransactionsByFamilyMember(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listTransactionsByFamilyMemberRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listMyTransactionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyTransactions', inputVars);
}
listMyTransactionsRef.operationName = 'ListMyTransactions';
exports.listMyTransactionsRef = listMyTransactionsRef;

exports.listMyTransactions = function listMyTransactions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listMyTransactionsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listMyTransactionsByDateRangeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyTransactionsByDateRange', inputVars);
}
listMyTransactionsByDateRangeRef.operationName = 'ListMyTransactionsByDateRange';
exports.listMyTransactionsByDateRangeRef = listMyTransactionsByDateRangeRef;

exports.listMyTransactionsByDateRange = function listMyTransactionsByDateRange(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMyTransactionsByDateRangeRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getFamilyByInviteCodeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetFamilyByInviteCode', inputVars);
}
getFamilyByInviteCodeRef.operationName = 'GetFamilyByInviteCode';
exports.getFamilyByInviteCodeRef = getFamilyByInviteCodeRef;

exports.getFamilyByInviteCode = function getFamilyByInviteCode(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getFamilyByInviteCodeRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getMyFamilyDetailRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyFamilyDetail');
}
getMyFamilyDetailRef.operationName = 'GetMyFamilyDetail';
exports.getMyFamilyDetailRef = getMyFamilyDetailRef;

exports.getMyFamilyDetail = function getMyFamilyDetail(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMyFamilyDetailRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getMyJoinRequestsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyJoinRequests');
}
getMyJoinRequestsRef.operationName = 'GetMyJoinRequests';
exports.getMyJoinRequestsRef = getMyJoinRequestsRef;

exports.getMyJoinRequests = function getMyJoinRequests(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMyJoinRequestsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
