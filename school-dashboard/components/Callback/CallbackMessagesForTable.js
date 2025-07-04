import { useState } from 'react'
import { useUser } from '../User';
import { UPDATE_CALLBACK_MESSAGES_MUTATION } from './CallbackCardMessages';
import { useMutation } from '@apollo/client';
import { toast } from 'react-hot-toast';
import { QueryClient, useQueryClient } from 'react-query';

export default function CallbackMessagesForTable({ callbackItem }) {
    // console.log(callbackItem)
    const me = useUser();
    const isTeacher = me.id === callbackItem.teacher.id;
    const isStudent = me.id === callbackItem.student.id;
    const currentDate = new Date().toLocaleDateString();
    const [teacherMessage, setTeacherMessage] = useState(callbackItem.messageFromTeacher || '');
    const [studentMessage, setStudentMessage] = useState(callbackItem.messageFromStudent || '');
    const [teacherMessageDate, setTeacherMessageDate] = useState(
        callbackItem.messageFromTeacherDate || ''
    );
    const [studentMessageDate, setStudentMessageDate] = useState(
        callbackItem.messageFromStudentDate || ''
    );
    const [updateCallback] = useMutation(
        UPDATE_CALLBACK_MESSAGES_MUTATION,
        {
            variables: {
                id: callbackItem.id,
                messageFromTeacher: teacherMessage,
                messageFromTeacherDate: teacherMessageDate,
                messageFromStudent: studentMessage,
                messageFromStudentDate: studentMessageDate,
            },
        }
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await updateCallback();
        if (res) {
            toast.success(
                `Updated Callback Message for ${callbackItem.student.name}`
            );
        }
    };

    const submitOnEnter = (e) => {
        if (e.key === 'Enter' && e.shiftKey === false) {
            handleSubmit(e);
        }
    };

    return (
        <div className="grid grid-cols-2 justify-start items-start">
            <div className='flex flex-col items-center h-full justify-between m-0.5 p-0.5 rounded-lg text-xl leading-6'>
                <span className="text-2xl leading-6 py-0.5 px-2">Teacher</span>
                {!isTeacher &&
                    <>
                        <span className='text-xl leading-6 py-0.5 px-2'>{teacherMessage}</span>
                        <span className='text-xs'>{teacherMessageDate}</span>
                    </>
                }
                {isTeacher &&
                    <>
                        <textarea
                            type='text'
                            placeholder='message'
                            value={teacherMessage}
                            title="Enter to submit change, Shift-Enter for new line"
                            onKeyDown={submitOnEnter}
                            className="w-full py-0 px-2 m-0 bg-inherit text-inherit overflow-hidden"
                            onChange={(e) => {
                                setTeacherMessage(e.target.value)
                                setTeacherMessageDate(currentDate)
                            }}
                        />
                        <span className='text-xs'>{teacherMessageDate}</span>
                    </>
                }
            </div>
            <div className='flex flex-col items-center h-full justify-between m-0.5 p-0.5 rounded-lg text-xl leading-6'>
                <span className="text-2xl leading-6 py-0.5 px-2">Student</span>
                {!isStudent &&
                    <>
                        <span className='text-xl leading-6 py-0.5 px-2'>{studentMessage}</span>
                        <span className='text-xs'>{studentMessageDate}</span>
                    </>
                }
                {isStudent &&
                    <>
                        <textarea
                            type='text'
                            placeholder='message'
                            value={studentMessage}
                            title="Enter to submit change, Shift-Enter for new line"
                            onKeyDown={submitOnEnter}
                            className="w-full py-0 px-2 m-0 bg-inherit text-inherit overflow-hidden"
                            onChange={(e) => {
                                setStudentMessage(e.target.value)
                                setStudentMessageDate(currentDate)
                            }}
                        />
                        <span className='text-xs'>{studentMessageDate}</span>
                    </>
                }
            </div>
        </div>
    )
}
