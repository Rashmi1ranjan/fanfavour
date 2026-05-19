export const getCustomArgumentOfEmail = (emailFrom, type, domain) => {
    return {
        'platformDomainName': domain,
        'emailFrom': emailFrom,
        'type': type
    }
}
