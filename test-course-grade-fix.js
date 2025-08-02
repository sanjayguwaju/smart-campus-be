const mongoose = require('mongoose');
const CourseGrade = require('./src/models/courseGrade.model');

// Test data
const testGradeData = {
  student: new mongoose.Types.ObjectId(),
  course: new mongoose.Types.ObjectId(),
  faculty: new mongoose.Types.ObjectId(),
  semester: 1,
  academicYear: '2024-2025',
  finalGrade: 'A',
  numericalGrade: 95,
  gradePoints: 4.0,
  credits: 3,
  submittedBy: new mongoose.Types.ObjectId()
};

async function testCourseGradeCreation() {
  try {
    console.log('Testing course grade creation...');
    
    // Test 1: Create with credits
    const courseGrade = new CourseGrade(testGradeData);
    await courseGrade.save();
    
    console.log('✅ Course grade created successfully with credits');
    console.log('Quality points:', courseGrade.qualityPoints);
    console.log('Credits:', courseGrade.credits);
    
    // Test 2: Create without credits (should use default)
    const testGradeDataNoCredits = { ...testGradeData };
    delete testGradeDataNoCredits.credits;
    
    const courseGradeNoCredits = new CourseGrade(testGradeDataNoCredits);
    await courseGradeNoCredits.save();
    
    console.log('✅ Course grade created successfully without credits (using default)');
    console.log('Quality points:', courseGradeNoCredits.qualityPoints);
    console.log('Credits:', courseGradeNoCredits.credits);
    
    // Clean up
    await CourseGrade.deleteMany({});
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  // Connect to MongoDB (you'll need to update this URL)
  mongoose.connect('mongodb://localhost:27017/smart-campus-test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    return testCourseGradeCreation();
  })
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testCourseGradeCreation }; 