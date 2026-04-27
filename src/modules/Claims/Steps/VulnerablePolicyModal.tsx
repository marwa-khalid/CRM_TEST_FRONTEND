import React from "react";
import Vulnerable from "../../../assets/AutoClaim_icon/Vulnerable.svg";

export const VulnerablePolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-4 md:p-8 font-['Stack_Sans_Headline']"
    >
      <div
        className="bg-white w-full max-w-[900px] h-[90vh] flex flex-col overflow-hidden rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full px-6 md:px-10 py-5 bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] flex justify-between items-center relative z-10 shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={onClose}
              className="hover:bg-gray-100 p-1 rounded-full transition-colors"
            >
              <img src={Vulnerable} alt="Back" />
            </button>

            <div className="text-neutral-900 text-[20px] md:text-xl font-weight-600 font-['Stack_Sans_Headline'] leading-6">
              Vulnerable Persons Policy
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-6 md:px-10 py-3 md:py-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded flex justify-center items-center transition-colors"
          >
            <span className="text-white text-sm md:text-base font-weight-400 font-['Stack_Sans_Headline'] leading-4">
              Close
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <div
            id="vulnerable-policy-document"
            className="w-full max-w-[794px] mx-auto bg-white px-6 md:px-12 py-10 md:py-14 text-neutral-800 font-['Stack_Sans_Headline'] leading-7"
          >
            {/* <div className="text-center mb-14">
              <h1 className="text-3xl md:text-4xl font-weight-600 text-black">
                The CAMS Group &
              </h1>
              <h2 className="mt-4 text-2xl md:text-3xl font-weight-600 text-black">
                Vulnerable Persons Policy
              </h2>
            </div> */}

            <section className="space-y-5">
              <h3 className="text-xl md:text-2xl font-weight-600 text-black">
                What is a vulnerable person’s policy?
              </h3>

              <p className="text-base font-weight-400">
                You may at some stage have a conversation with a consumer who
                finds it difficult to make an informed decision or choice about
                an injury incurred or any accident related aid products which
                you are offering to them whether this be a client or a passenger
                involved in the incident.
              </p>

              <p className="text-base font-weight-400">
                Examples of what may make a person vulnerable to any products
                offered by you are below:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>Anxiety</li>
                <li>Learning difficulties</li>
                <li>Dementia</li>
                <li>Language difficulties</li>
              </ul>

              <p className="text-base font-weight-400">
                Our vulnerable person’s policy has been implemented to ensure
                that every consumer who is offered a product or service by you
                on behalf of Central Accident Management Services Ltd and
                Nationwide Assist Ltd has a full understanding of the service
                itself and can make an informed decision or choice about the
                outcome of their decision should they decide to utilise or not
                utilise the service being offered by you without their judgement
                being clouded by any condition or suffering themselves.
              </p>

              <p className="text-base font-weight-400">
                If the consumer is vulnerable, this does{" "}
                <span className="font-weight-600">not</span> mean to say that
                you cannot offer our services to them but make no mistake, you{" "}
                <span className="font-weight-600">must</span> identify any
                vulnerability and take the steps stated throughout this policy
                to ensure that the consumer makes a correct and informed choice
                or decision and that a consumer “Yes” to any question, product
                or service is definitely an informed decision and{" "}
                <span className="font-weight-600">not</span> a submission.
              </p>
            </section>

            <section className="mt-12 space-y-5">
              <h3 className="text-xl md:text-2xl font-weight-600 text-black">
                What products or services should you apply the Vulnerable
                person’s policy to?
              </h3>

              <p className="text-base font-weight-400">
                The vulnerable person’s policy should be applied to absolutely
                any product or service offered to consumers or potential
                customers of Nationwide Assist Ltd which include but are not
                limited to the following examples:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>
                  Personal injury (recommending a panel solicitor to the
                  consumer for the processing of any personal injury claim)
                </li>
                <li>
                  Credit Hire (the offering of a like for like vehicle following
                  a road traffic incident)
                </li>
                <li>
                  Claims management services (the management of a non-fault
                  parties claim from first notification of loss to recovery of
                  all outlays)
                </li>
                <li>Insurance products</li>
              </ul>
            </section>

            <section className="mt-12 space-y-5">
              <h3 className="text-xl md:text-2xl font-weight-600 text-black">
                Why is it crucial that we as a business ensure that we are aware
                of any vulnerable persons prior to the offering of any service?
              </h3>

              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>Anxiety</li>
                <li>Learning difficulties</li>
                <li>Dementia</li>
                <li>Language difficulties</li>
                <li>Mental health</li>
              </ul>

              <p className="text-base font-weight-400">
                The above are just a few examples of the types of conditions
                which may affect a consumer when asked by you to make a decision
                about any product or service offering from Central Accident
                Management Services Ltd or Nationwide Assist Ltd.
              </p>

              <p className="text-base font-weight-400">
                Should a consumer suffer from any of these conditions you must
                be understanding and aware that, for example, the below example,
                one example of many, could make it hard for the consumer to make
                the correct decision or worse cloud their judgement about the
                service being offered by you.
              </p>

              <div className="italic">
                <p className="text-base font-weight-600 text-black mb-2">
                  Example:
                </p>
                <p className="text-base">
                  The definition of anxiety is: a feeling of worry, nervousness,
                  or unease about something with an uncertain outcome.
                </p>
                <p className="text-base mt-3">
                  A consumer who suffers from anxiety may and will most likely
                  feel pressured to accept following even the slightest
                  suggestion of a product or service offering to avoid any
                  prolonged conversation due to nervousness or unease.
                </p>
              </div>

              <p className="text-base font-weight-400">
                The above example gives a clear understanding of why it is
                crucial to ensure that we as a business, and you as a member of
                its team, ensure that we are made aware of any condition or
                conditions which may cloud a consumer’s judgement on accepting
                any service offered by you.
              </p>
            </section>

            <section className="mt-12 space-y-5">
              <h3 className="text-xl md:text-2xl font-weight-600 text-black">
                What may be the outcome of not identifying a vulnerable person
                prior to the offering of any service or product?
              </h3>

              <p className="text-base font-weight-400">
                The Mental Capacity Act states that a person is unable to make a
                decision if they cannot understand the information about the
                decision to be made, cannot retain that information in their
                mind, cannot use or weigh that information to be used as part of
                the decision making process, or cannot communicate their
                decision.
              </p>

              <p className="text-base font-weight-400">
                Not identifying any vulnerable persons prior to the offering of
                any product or service may cause the consumer to make the wrong
                decision, a decision that they feel forced to make in the case
                of suffering from anxiety, or a decision made based on not fully
                understanding the service offered.
              </p>

              <p className="text-base font-weight-400">
                Whatever the condition may be, it leaves the consumer vulnerable
                to products or services offered which they may not:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>Require</li>
                <li>Understand</li>
                <li>Be able to afford</li>
              </ul>

              <p className="text-base font-weight-400">
                As such, it may cause that vulnerable person, for example, to
                place themselves in a difficult financial situation or worse,
                cause their condition to worsen.
              </p>
            </section>

            <section className="mt-12 space-y-5">
              <h3 className="text-xl md:text-2xl font-weight-600 text-black">
                What are the do’s and don’ts that you and our business can and
                cannot do to ensure that we identify any vulnerable persons?
              </h3>

              <div>
                <p className="text-lg font-weight-600 text-black mb-3">
                  You cannot:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base">
                  <li>
                    Directly ask or suggest to a consumer whether they have any
                    condition which makes them vulnerable to our services
                  </li>
                  <li>
                    Make that person feel in any way vulnerable or point out any
                    assumed condition
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-lg font-weight-600 text-black mb-3">
                  You may and are required to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base">
                  <li>
                    Use your own initiative without suggestion to the consumer
                    of doing so to make an informed decision yourself on whether
                    the consumer may be vulnerable by asking yourself the
                    following questions at any stage of the call and prior to
                    any service offering or explanation,
                  </li>
                </ul>
              </div>

              <div className="">
                <ul className="space-y-2 text-base">
                  <li>Does the consumer seem confused?</li>
                  <li>
                    Are they asking questions which are not related to the
                    conversation being held?
                  </li>
                  <li>
                    Are they saying “Yes” promptly to questions being asked by
                    you and giving any indication that they have not taken the
                    time to think before answering?
                  </li>
                  <li>
                    Are they suggesting that someone else usually makes their
                    decisions for them, for example “My wife usually deals with
                    things like this”?
                  </li>
                  <li>Do they speak clear English?</li>
                </ul>
              </div>
            </section>

            <section className="mt-12 space-y-5">
              <h3 className="text-xl md:text-2xl font-weight-600 text-black">
                Tips when talking to any vulnerable persons
              </h3>

              <p className="text-base font-weight-400">
                There may be many things that you can do to ensure that any
                vulnerable persons have a full understanding of the service
                offered to them by you and that they make an informed decision
                on their own.
              </p>

              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>
                  Begin by asking if now is a good time to talk or whether there
                  is a better time for you to call the consumer back
                </li>
                <li>
                  Feed each piece of information in short brief stages, allowing
                  enough time to digest the information before moving on
                </li>
                <li>
                  Ask at every stage whether they understand what you have
                  explained to them
                </li>
                <li>
                  Ensure that you do not rush the consumer into any decision
                </li>
                <li>
                  Do not assume that you know the consumer’s needs; only the
                  consumer is aware of their own needs
                </li>
                <li>
                  Allow the consumer to take their time in understanding and
                  digesting all information provided
                </li>
                <li>
                  Ensure that you are not making suggestions which may influence
                  their decision to accept your service or product offering
                </li>
                <li>
                  Ask the consumer at the end of each partial explanation
                  whether they require anything to be explained again
                </li>
                <li>Be patient at all times</li>
                <li>
                  Following the provision of a full explanation into the product
                  or service offered, ask that they re-iterate their own
                  understanding of the service offered
                </li>
                <li>
                  Address any incorrect understanding of the service offered
                </li>
                <li>
                  Be calm and talk softly, clearly, and slowly if required at
                  all times
                </li>
              </ul>
            </section>

            <section className="mt-12 space-y-5">
              <h3 className="text-xl md:text-2xl font-weight-600 text-black">
                What you should do and consider prior to making a sale or making
                an agreement with the consumer to utilise the services offered
              </h3>

              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>
                  Ask yourself whether you honestly feel that any “Yes” given to
                  you by the consumer is a genuine agreement based on the
                  consumer having a full understanding of the product or
                  services offered
                </li>
                <li>
                  Consider whether the “Yes” may just be an agreement made to
                  put an end to a prolonged conversation due to anxiety or lack
                  of understanding
                </li>
                <li>
                  Ask whether the consumer has received enough information to
                  allow them to make a correct informed decision
                </li>
                <li>
                  Before they proceed, ask whether they need to discuss the
                  service offered with anyone else before making a final
                  decision
                </li>
                <li>
                  Ask whether they would like you to call back later at a time
                  which is best for them
                </li>
                <li>
                  If the consumer seems flustered or agitated, immediately ask
                  the above questions
                </li>
                <li>
                  Ask whether they would feel more comfortable if a third party,
                  maybe a family member, joined a conference call and listened
                  to the service or product explanation again
                </li>
              </ul>
            </section>

            <section className="mt-12 space-y-5">
              <h3 className="text-xl md:text-2xl font-weight-600 text-black">
                What should I do if, even after carrying out and adhering to the
                vulnerable person’s policy, I still feel that the consumer
                cannot or has not been able to make an informed decision?
              </h3>

              <p className="text-base font-weight-400">
                In the event that you feel that a decision or choice has been
                made but you still feel that the consumer, following your
                processing of the vulnerable person’s policy, has not made an
                informed decision or has not fully understood your explanation
                of the product or service offered to them, you must seek the
                guidance of senior management:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>Line Manager</li>
                <li>Group Operations Manager</li>
              </ul>

              <p className="text-base font-weight-400">
                The above final decision makers will review thoroughly, listen
                to the call recording, and make a final decision on how to
                proceed.
              </p>

              <p className="text-base font-weight-400">
                You will need to provide the above-mentioned persons with:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>
                  The date and time of any calls made or received with the
                  vulnerable person in relation to the service or product
                  offered
                </li>
                <li>
                  The telephone number on which you made or received these calls
                </li>
                <li>The client’s claim reference</li>
                <li>
                  An explanation into why you feel that the situation requires
                  escalation
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};