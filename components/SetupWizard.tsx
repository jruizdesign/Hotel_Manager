import React, { useState } from 'react';
import { Staff, Room, StaffStatus } from '../types';
import { Button, TextField, Stepper, Step, StepLabel, Typography, Container, Paper, Box } from '@mui/material';

interface SetupWizardProps {
  onSetupComplete: (rooms: Omit<Room, 'id' | 'status'>[], admin: Omit<Staff, 'id'>) => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [hotelName, setHotelName] = useState('');
  const [adminUser, setAdminUser] = useState({ name: '', pin: '' });
  const [rooms, setRooms] = useState<Partial<Room>[]>([]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFinish = () => {
    const admin: Omit<Staff, 'id'> = {
      name: adminUser.name,
      pin: adminUser.pin,
      role: 'Superuser',
      shift: 'Day',
      status: StaffStatus.ON_DUTY,
    };

    // In a real scenario, you would collect room data in one of the steps.
    // For now, we'll pass an empty array.
    const roomsToCreate: Omit<Room, 'id' | 'status'>[] = []; 

    localStorage.setItem('hotelName', hotelName);
    onSetupComplete(roomsToCreate, admin);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <TextField
            label="Hotel Name"
            value={hotelName}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setHotelName(e.target.value)}
            fullWidth
          />
        );
      case 1:
        return (
          <>
            <TextField
              label="Admin Name"
              value={adminUser.name}
              onChange={(e: { target: { value: any; }; }) => setAdminUser({ ...adminUser, name: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Admin PIN"
              type="password"
              value={adminUser.pin}
              onChange={(e: { target: { value: any; }; }) => setAdminUser({ ...adminUser, pin: e.target.value })}
              fullWidth
              margin="normal"
            />
          </>
        );
      case 2:
        return <Typography>Room setup would go here. (Placeholder)</Typography>; 
      default:
        return 'Unknown step';
    }
  };

  const steps = ['Set Hotel Name', 'Create Admin User', 'Add Rooms'];

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Hotel Setup Wizard
        </Typography>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <>
          {getStepContent(activeStep)}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            {activeStep !== 0 && (
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
            )}
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleFinish : handleNext}
            >
              {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </>
      </Paper>
    </Container>
  );
};

export default SetupWizard;
