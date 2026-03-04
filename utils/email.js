import dns from 'dns/promises'
import disposableDomains from './disposableDomains.json' with { type: 'json' }

const roles = [
  'admin',
  'support',
  'info',
  'sales',
  'contact',
  'billing'
]

const freeProviders = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'protonmail.com'
]

export function isValidSyntax(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isDisposable(domain){
  return disposableDomains.includes(domain.toLowerCase())
}

export function isRoleBased(email){
  const local = email.split('@')[0].toLowerCase()
  return roles.includes(local)
}

export function isFreeProvider(domain){
  return freeProviders.includes(domain.toLowerCase())
}

export async function hasMxRecords(domain){
  try {
    const records = await dns.resolveMx(domain)
    return records && records.length > 0
  } catch {
    return false
  }
}
