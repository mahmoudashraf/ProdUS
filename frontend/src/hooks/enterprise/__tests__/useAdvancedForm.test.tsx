import { act, renderHook } from '@testing-library/react';
import { useAdvancedForm } from '../useAdvancedForm';

interface IntakeForm {
  productName: string;
  businessGoal: string;
}

describe('useAdvancedForm', () => {
  it('blocks submit and marks fields when validation fails', async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() =>
      useAdvancedForm<IntakeForm>({
        initialValues: { productName: '', businessGoal: '' },
        validationRules: {
          productName: [{ type: 'required', message: 'Product name is required' }],
          businessGoal: [{ type: 'required', message: 'Business goal is required' }],
        },
        onSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit()();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.productName).toBe('Product name is required');
    expect(result.current.errors.businessGoal).toBe('Business goal is required');
    expect(result.current.touched.productName).toBe(true);
  });

  it('submits valid values and resets to initial state', async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() =>
      useAdvancedForm<IntakeForm>({
        initialValues: { productName: '', businessGoal: '' },
        validationRules: {
          productName: [{ type: 'required', message: 'Product name is required' }],
        },
        onSubmit,
      })
    );

    act(() => {
      result.current.setValue('productName', 'ProdUS');
      result.current.setValue('businessGoal', 'Ship a productization package');
    });

    await act(async () => {
      await result.current.handleSubmit()();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      productName: 'ProdUS',
      businessGoal: 'Ship a productization package',
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values).toEqual({ productName: '', businessGoal: '' });
    expect(result.current.isDirty).toBe(false);
  });
});
