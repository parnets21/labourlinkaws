/**
 * Unit tests for RoleBasedRequirementsService
 */

const RoleBasedRequirementsService = require('../roleBasedRequirementsService');

describe('RoleBasedRequirementsService', () => {
  let requirementsService;

  beforeEach(() => {
    requirementsService = new RoleBasedRequirementsService();
  });

  describe('getRequiredDocuments', () => {
    test('should return correct documents for employer role', () => {
      const result = requirementsService.getRequiredDocuments('employer');
      
      expect(result.success).toBe(true);
      expect(result.documents).toEqual(['gst', 'pan']);
      expect(result.userModel).toBe('Employer');
      expect(result.userRoleDisplay).toBe('Employer');
      expect(result.totalRequired).toBe(2);
    });

    test('should return correct documents for startup_employer role', () => {
      const result = requirementsService.getRequiredDocuments('startup_employer');
      
      expect(result.success).toBe(true);
      expect(result.documents).toEqual(['pan', 'tin']);
      expect(result.userModel).toBe('Employer');
      expect(result.userRoleDisplay).toBe('New Startup Employer');
    });

    test('should return correct documents for employee role', () => {
      const result = requirementsService.getRequiredDocuments('employee');
      
      expect(result.success).toBe(true);
      expect(result.documents).toEqual(['pan', 'aadhar']);
      expect(result.userModel).toBe('user');
      expect(result.userRoleDisplay).toBe('Employee');
    });

    test('should return correct documents for individual_employer role', () => {
      const result = requirementsService.getRequiredDocuments('individual_employer');
      
      expect(result.success).toBe(true);
      expect(result.documents).toEqual(['pan', 'aadhar']);
      expect(result.userModel).toBe('user');
      expect(result.userRoleDisplay).toBe('Individual Employer');
    });

    test('should handle invalid role', () => {
      const result = requirementsService.getRequiredDocuments('invalid_role');
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_ROLE');
      expect(result.supportedRoles).toBeDefined();
    });

    test('should handle missing role', () => {
      const result = requirementsService.getRequiredDocuments();
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('MISSING_ROLE');
    });

    test('should handle case insensitive roles', () => {
      const result = requirementsService.getRequiredDocuments('EMPLOYER');
      
      expect(result.success).toBe(true);
      expect(result.documents).toEqual(['gst', 'pan']);
    });
  });

  describe('validateRoleDocuments', () => {
    test('should validate complete document set for employer', () => {
      const uploadedDocs = ['gst', 'pan'];
      const result = requirementsService.validateRoleDocuments('employer', uploadedDocs);
      
      expect(result.success).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.completionPercentage).toBe(100);
    });

    test('should identify missing documents for employer', () => {
      const uploadedDocs = ['pan']; // Missing GST
      const result = requirementsService.validateRoleDocuments('employer', uploadedDocs);
      
      expect(result.success).toBe(true);
      expect(result.isComplete).toBe(false);
      expect(result.missing).toEqual(['gst']);
      expect(result.completionPercentage).toBe(50);
      expect(result.missingDetails).toBeDefined();
      expect(result.missingDetails[0].type).toBe('gst');
    });

    test('should handle empty uploaded documents', () => {
      const result = requirementsService.validateRoleDocuments('employee', []);
      
      expect(result.success).toBe(true);
      expect(result.isComplete).toBe(false);
      expect(result.missing).toEqual(['pan', 'aadhar']);
      expect(result.completionPercentage).toBe(0);
    });

    test('should identify extra documents', () => {
      const uploadedDocs = ['pan', 'aadhar', 'gst']; // GST not required for employee
      const result = requirementsService.validateRoleDocuments('employee', uploadedDocs);
      
      expect(result.success).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.extra).toEqual(['gst']);
    });

    test('should handle document objects with documentType property', () => {
      const uploadedDocs = [
        { documentType: 'pan' },
        { documentType: 'aadhar' }
      ];
      const result = requirementsService.validateRoleDocuments('employee', uploadedDocs);
      
      expect(result.success).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.uploaded).toEqual(['pan', 'aadhar']);
    });
  });

  describe('isDocumentRequiredForRole', () => {
    test('should return true for required document', () => {
      expect(requirementsService.isDocumentRequiredForRole('employer', 'gst')).toBe(true);
      expect(requirementsService.isDocumentRequiredForRole('employer', 'pan')).toBe(true);
      expect(requirementsService.isDocumentRequiredForRole('employee', 'aadhar')).toBe(true);
    });

    test('should return false for non-required document', () => {
      expect(requirementsService.isDocumentRequiredForRole('employee', 'gst')).toBe(false);
      expect(requirementsService.isDocumentRequiredForRole('employer', 'aadhar')).toBe(false);
    });

    test('should return false for invalid role', () => {
      expect(requirementsService.isDocumentRequiredForRole('invalid', 'pan')).toBe(false);
    });
  });

  describe('determineUserRole', () => {
    test('should determine employer role from company name', () => {
      const registrationData = { CompanyName: 'Test Company', GstNum: '123456' };
      const role = requirementsService.determineUserRole(registrationData);
      
      expect(role).toBe('employer');
    });

    test('should determine startup_employer role from company without GST', () => {
      const registrationData = { CompanyName: 'Startup Inc' }; // No GST
      const role = requirementsService.determineUserRole(registrationData);
      
      expect(role).toBe('startup_employer');
    });

    test('should determine individual_employer role', () => {
      const registrationData = { userRole: 'individual_employer' };
      const role = requirementsService.determineUserRole(registrationData);
      
      expect(role).toBe('individual_employer');
    });

    test('should default to employee role', () => {
      const registrationData = { fullName: 'John Doe' };
      const role = requirementsService.determineUserRole(registrationData);
      
      expect(role).toBe('employee');
    });

    test('should handle empty registration data', () => {
      const role = requirementsService.determineUserRole({});
      
      expect(role).toBe('employee');
    });
  });

  describe('getValidationMessages', () => {
    test('should return success message for complete documents', () => {
      const result = requirementsService.getValidationMessages('employer', []);
      
      expect(result.success).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.message).toContain('All required documents');
    });

    test('should return error message for missing documents', () => {
      const result = requirementsService.getValidationMessages('employer', ['gst']);
      
      expect(result.success).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.message).toContain('Missing required documents');
      expect(result.missingNames).toEqual(['GST Certificate']);
      expect(result.actionRequired).toBeDefined();
    });

    test('should handle invalid role', () => {
      const result = requirementsService.getValidationMessages('invalid', []);
      
      expect(result.error).toBeDefined();
      expect(result.code).toBeDefined();
    });
  });

  describe('validateRoleTransition', () => {
    test('should validate transition from employee to employer', () => {
      const currentDocs = ['pan', 'aadhar'];
      const result = requirementsService.validateRoleTransition('employee', 'employer', currentDocs);
      
      expect(result.success).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.additionalDocumentsNeeded).toEqual(['gst']);
      expect(result.obsoleteDocuments).toEqual(['aadhar']);
      expect(result.requiresAdditionalUpload).toBe(true);
    });

    test('should validate transition with no additional documents needed', () => {
      const currentDocs = ['pan', 'aadhar'];
      const result = requirementsService.validateRoleTransition('employee', 'individual_employer', currentDocs);
      
      expect(result.success).toBe(true);
      expect(result.additionalDocumentsNeeded).toEqual([]);
      expect(result.requiresAdditionalUpload).toBe(false);
    });

    test('should handle invalid roles in transition', () => {
      const result = requirementsService.validateRoleTransition('invalid', 'employer', []);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_TRANSITION_ROLE');
    });
  });

  describe('utility methods', () => {
    test('should get supported roles', () => {
      const roles = requirementsService.getSupportedRoles();
      
      expect(roles).toHaveLength(4);
      expect(roles.map(r => r.role)).toContain('employer');
      expect(roles.map(r => r.role)).toContain('employee');
      expect(roles.map(r => r.role)).toContain('startup_employer');
      expect(roles.map(r => r.role)).toContain('individual_employer');
    });

    test('should get document info', () => {
      const info = requirementsService.getDocumentInfo('pan');
      
      expect(info.success).toBe(true);
      expect(info.name).toBe('PAN Card');
      expect(info.requiredForRoles).toContain('employer');
      expect(info.requiredForRoles).toContain('employee');
    });

    test('should handle unknown document type', () => {
      const info = requirementsService.getDocumentInfo('unknown');
      
      expect(info.success).toBe(false);
      expect(info.code).toBe('UNKNOWN_DOCUMENT_TYPE');
    });
  });
});