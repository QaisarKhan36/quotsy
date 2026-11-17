import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { BusinessForm } from '../components/BusinessForm';
import { useStore } from '../lib/store';

export default function BusinessScreen() {
  const { data, updateBusiness } = useStore();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <BusinessForm b={data.business} set={updateBusiness} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
