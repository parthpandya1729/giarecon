// Simple test file to verify TypeScript imports work
// Run with: npx tsx test-imports.ts

import { BaseEntity, Status, Severity } from './src/types/common.types'
import { Workspace } from './src/types/workspace.types'
import { ChatMessage } from './src/types/chat.types'

console.log('✓ Testing TypeScript imports...\n')

// Test 1: BaseEntity type
const testEntity: BaseEntity = {
  id: 'test-123',
  createdAt: new Date(),
  updatedAt: new Date(),
}
console.log('✓ BaseEntity import works:', testEntity.id)

// Test 2: Status type
const testStatus: Status = 'active'
console.log('✓ Status import works:', testStatus)

// Test 3: Severity type
const testSeverity: Severity = 'info'
console.log('✓ Severity import works:', testSeverity)

// Test 4: Workspace interface
const testWorkspace: Workspace = {
  id: 'ws-123',
  name: 'Test Workspace',
  description: 'Test description',
  status: 'active',
  createdAt: new Date(),
  stats: {
    totalRecords: 100,
    matched: 80,
    unmatched: 15,
    discrepancies: 5,
    matchPercentage: 80.0,
  },
}
console.log('✓ Workspace import works:', testWorkspace.name)

// Test 5: ChatMessage interface
const testMessage: ChatMessage = {
  id: 'msg-123',
  role: 'user',
  content: 'Hello',
  status: 'sent',
  createdAt: new Date(),
  updatedAt: new Date(),
}
console.log('✓ ChatMessage import works:', testMessage.role)

console.log('\n✅ All imports working correctly!')
console.log('The TypeScript type files are properly configured.\n')
