import { demoGetProfile, demoUpdateProfile } from '../demoAdapter';

test('demo profile loads the fictional patient and updates supported fields in memory', async () => {
  const initial = await demoGetProfile();
  const updated = await demoUpdateProfile({ city: 'Karachi', full_name: 'Demo Patient Updated' });

  expect(initial.email).toBe('demo@sehatconnect.test');
  expect(updated).toEqual(
    expect.objectContaining({
      full_name: 'Demo Patient Updated',
      city: 'Karachi',
      email: 'demo@sehatconnect.test',
    })
  );
  expect(await demoGetProfile()).toEqual(updated);
});
