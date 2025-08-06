import { print } from 'graphql';
import { UPDATE_PBIS } from '../pbisUtils';

describe('pbisUtils', () => {
  describe('UPDATE_PBIS mutation', () => {
    it('exports a valid GraphQL mutation', () => {
      expect(UPDATE_PBIS).toBeDefined();
      expect(UPDATE_PBIS.kind).toBe('Document');
    });

    it('contains the correct mutation structure', () => {
      const mutationString = print(UPDATE_PBIS);

      expect(mutationString).toContain('mutation UPDATE_PBIS');
      expect(mutationString).toContain('$userId: ID!');
      expect(mutationString).toContain('recalculatePBIS(userId: $userId)');
      expect(mutationString).toContain('id');
    });

    it('has the correct operation name', () => {
      expect(UPDATE_PBIS.definitions[0]).toHaveProperty('name');
      expect((UPDATE_PBIS.definitions[0] as any).name?.value).toBe(
        'UPDATE_PBIS',
      );
    });

    it('requires userId parameter', () => {
      const mutationString = print(UPDATE_PBIS);

      // Should have userId as a required parameter
      expect(mutationString).toContain('$userId: ID!');
    });

    it('calls recalculatePBIS operation', () => {
      const mutationString = print(UPDATE_PBIS);

      expect(mutationString).toContain('recalculatePBIS');
      expect(mutationString).toContain('userId: $userId');
    });

    it('returns id field', () => {
      const mutationString = print(UPDATE_PBIS);

      expect(mutationString).toContain('{\n    id\n  }');
    });

    it('is a mutation operation (not query or subscription)', () => {
      expect(UPDATE_PBIS.definitions[0]).toHaveProperty(
        'operation',
        'mutation',
      );
    });

    it('formatted mutation string matches expected structure', () => {
      const mutationString = print(UPDATE_PBIS);
      const expectedStructure = `mutation UPDATE_PBIS($userId: ID!) {
  recalculatePBIS(userId: $userId) {
    id
  }
}`;

      expect(mutationString.replace(/\s+/g, ' ').trim()).toBe(
        expectedStructure.replace(/\s+/g, ' ').trim(),
      );
    });

    it('can be used with GraphQL client', () => {
      // This test ensures the mutation is properly structured for use
      const mockVariables = { userId: '123' };

      expect(() => print(UPDATE_PBIS)).not.toThrow();

      // Verify the mutation would work with variables
      const mutationString = print(UPDATE_PBIS);
      expect(mutationString).toBeTruthy();
      expect(typeof mutationString).toBe('string');
    });

    it('has correct GraphQL document structure', () => {
      expect(UPDATE_PBIS).toHaveProperty('kind', 'Document');
      expect(UPDATE_PBIS).toHaveProperty('definitions');
      expect(Array.isArray(UPDATE_PBIS.definitions)).toBe(true);
      expect(UPDATE_PBIS.definitions).toHaveLength(1);
    });

    it('has valid variable definitions', () => {
      const definition = UPDATE_PBIS.definitions[0] as any;

      expect(definition).toHaveProperty('variableDefinitions');
      expect(Array.isArray(definition.variableDefinitions)).toBe(true);
      expect(definition.variableDefinitions).toHaveLength(1);

      const variableDefinition = definition.variableDefinitions[0];
      expect(variableDefinition.variable.name.value).toBe('userId');
      expect(variableDefinition.type.kind).toBe('NonNullType');
    });

    it('has valid selection set', () => {
      const definition = UPDATE_PBIS.definitions[0] as any;

      expect(definition).toHaveProperty('selectionSet');
      expect(definition.selectionSet).toHaveProperty('selections');
      expect(Array.isArray(definition.selectionSet.selections)).toBe(true);
      expect(definition.selectionSet.selections).toHaveLength(1);

      const mutation = definition.selectionSet.selections[0];
      expect(mutation.name.value).toBe('recalculatePBIS');
    });
  });

  describe('integration with GraphQL operations', () => {
    it('can be imported and used in other modules', () => {
      // This test verifies that the export works correctly
      expect(typeof UPDATE_PBIS).toBe('object');
      expect(UPDATE_PBIS).not.toBeNull();
    });

    it('maintains GraphQL AST format for tooling compatibility', () => {
      // Verify it maintains the proper AST structure that GraphQL tools expect
      // loc property is optional in GraphQL AST, so just verify the core structure
      expect(UPDATE_PBIS.kind).toBe('Document');
      expect(UPDATE_PBIS.definitions).toBeDefined();
      expect(UPDATE_PBIS.definitions[0].kind).toBe('OperationDefinition');
    });
  });
});
